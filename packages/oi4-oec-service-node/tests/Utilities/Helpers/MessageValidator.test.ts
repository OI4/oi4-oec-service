import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {DataSetClassIds, Resource, ServiceTypes} from '@oi4/oi4-oec-service-model';
import {EOPCUAMessageType, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {MessageValidator} from '../../../src/Utilities/Helpers/MessageValidator';
import {
    MqttMessageProcessor,
    OnSendMetaData,
    OnSendResource
} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import EventEmitter from 'events';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {TopicInfo, TopicWrapper} from '../../../dist/Utilities/Helpers/Types';

describe('Unit test for TopicParser', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const clearLogFile: Function = loggerItems.clearLogFile;
    const logContainsOnly: Function = loggerItems.logContainsOnly;

    const defaultEmitter: EventEmitter = new EventEmitter();

    const defaultServiceType: ServiceTypes = ServiceTypes.REGISTRY;
    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    const defaultPublisherId = `${defaultServiceType}/${defaultFakeAppId}`;
    const defaultTopicPrefix = `fake/${defaultServiceType}`;
    const defaultMethod: TopicMethods = TopicMethods.GET;
    const defaultResource: Resource = Resource.MAM;

    const defaultTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${defaultMethod}/${defaultResource}`;

    const defaultTopicInfo: TopicInfo = {
        topic: defaultTopic,
        appId: defaultFakeAppId,
        method: defaultMethod,
        resource: defaultResource,
        oi4Id: '',
        category: '',
        serviceType: defaultServiceType,
        tag: '',
        filter: '',
        licenseId: '',
        subResource: ''
    }
    const defaultTopicWrapper: TopicWrapper = {
        topic: defaultTopicInfo.topic,
        topicArray: defaultTopicInfo.topic.split('/'),
        topicInfo: defaultTopicInfo
    };

    const defaultParsedMessage: IOPCUANetworkMessage = {
        MessageId: 'fakeMessageId',
        MessageType: EOPCUAMessageType.uaData,
        PublisherId: defaultPublisherId,
        DataSetClassId: DataSetClassIds[defaultResource],
        Messages: []
    };

    function getMqttProcessorAndMockedData(mockedSendData: OnSendResource, emitter: EventEmitter = defaultEmitter, sendMetaData: OnSendMetaData = jest.fn()): any {
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeAppId;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendData, emitter),
            mockedData: {
                fakeOi4Id: defaultFakeAppId,
                fakeServiceType: 'fakeServiceType',
                fakeTopic: `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/mam`,
            },
        }
    }

    function getMockedBuilder(info: any): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {
            return Promise.resolve('FakeType');
        });

        return MockedOPCUABuilderFactory.getMockedOPCUABuilder(defaultFakeAppId, info.fakeServiceType);
    }

    const processorAndMockedData: any = getMqttProcessorAndMockedData(jest.fn());
    let defaultMockedBuilder: OPCUABuilder = undefined;

    beforeEach(() => {
        //Flush the messages log
        clearLogFile();
        MockedOPCUABuilderFactory.resetAllMocks();
        defaultMockedBuilder = getMockedBuilder(processorAndMockedData.mockedData);
    });

    it('If payload messages is empty a message is written n in the log', async () => {
        await MessageValidator.doPreliminaryValidation(defaultTopic, defaultParsedMessage, defaultMockedBuilder);
        expect(logContainsOnly('Messages Array empty in message - check DataSetMessage format')).toBeTruthy();
    });

    async function checkAgainstError(caller: Function, errMsg: string) {
        let errorThrown = false;
        try {
            await caller.call([]);
        } catch (err: any) {
            expect(err.message).toStrictEqual(errMsg);
            errorThrown = true;
        }
        expect(errorThrown).toBe(true);
    }

    it('If the publisher ID does not match, an error is thrown', async () => {
        defaultParsedMessage.PublisherId = 'fake/morefake'
        const errMsg = `ServiceType/AppID mismatch with Payload PublisherId: [Topic: ${defaultTopic} - Payload: ${defaultParsedMessage.PublisherId}]`;
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultTopic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If the parsed message has the wrong structure, an error is thrown', async () => {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            throw new Error('generic error');
        });

        const errMsg = 'OPC UA validation failed with: generic error';
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultTopic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If the topic path is wrong, an error is thrown', async () => {
        MockedOPCUABuilderFactory.resetAllMocks();
        const errMsg = 'Malformed topic Path';
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultTopic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If checkDataSetClassId mismatch, an error is thrown', async () => {
        defaultParsedMessage.DataSetClassId = DataSetClassIds[Resource.CONFIG]
        const errMsg = `DataSetClassId mismatch, got ${defaultParsedMessage.DataSetClassId}, expected ${DataSetClassIds[defaultTopicInfo.resource]}`;
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultTopicWrapper, defaultParsedMessage), errMsg);
    });

    it('If topic string is malformed, an error is thrown', async () => {
        const errMsg = `Invalid topic string structure ${defaultTopicInfo.topic}`;
        defaultTopicWrapper.topicArray = ['',''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultTopicWrapper, defaultParsedMessage), errMsg);

        defaultTopicWrapper.topicArray = ['','','','','','','','', ''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultTopicWrapper, defaultParsedMessage), errMsg);

        defaultTopicWrapper.topicArray = ['','','','','','','','','','', ''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultTopicWrapper, defaultParsedMessage), errMsg);

        defaultTopicWrapper.topicArray = ['','','','','','','','','','','','','','','','','','','',''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultTopicWrapper, defaultParsedMessage), errMsg);
    });

});
