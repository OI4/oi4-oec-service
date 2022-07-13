import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {DataSetClassIds, Resource, ServiceTypes} from '@oi4/oi4-oec-service-model';
import {EOPCUAMessageType, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import {MessageValidator} from '../../../src/Utilities/Helpers/MessageValidator';
import {
    MqttMessageProcessor,
    OnSendMetaData,
    OnSendResource
} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import EventEmitter from 'events';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';

describe('Unit test for TopicParser', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    
    const defaultServiceType: ServiceTypes = ServiceTypes.REGISTRY;
    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    //const defaultMethod: TopicMethods = TopicMethods.GET;
    const defaultResource: Resource = Resource.MAM;
    const defaultTopicPrefix = `fake/${defaultServiceType}`;
    //const defaultTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${defaultMethod}/${defaultResource}`;
    /*
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
*/
    const defaultPublisherId = `${defaultServiceType}/${defaultFakeAppId}`;
    const defaultParsedMessage: IOPCUANetworkMessage = {
        MessageId: 'fakeMessageId',
        MessageType: EOPCUAMessageType.uaData,
        PublisherId: defaultPublisherId,
        DataSetClassId: DataSetClassIds[defaultResource],
        Messages: []
    }

    const defaultEmitter: EventEmitter = new EventEmitter();
    let processorAndMockedData: any;
    
    function getMockedData() {
        return {
            fakeOi4Id: defaultFakeAppId,
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/mam`,
        }
    }
    
    function getMqttProcessorAndMockedData(mockedSendData: OnSendResource, emitter: EventEmitter = defaultEmitter, sendMetaData: OnSendMetaData = jest.fn()): any {
        const mockedData = getMockedData();
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeAppId;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendData, emitter),
            mockedData: mockedData,
        }
    }
    
    beforeAll(()=> {
        processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
    });

    function clearLogFile() {
        fakeLogFile.splice(0, fakeLogFile.length);
    }
    
    beforeEach(() => {
        //Flush the messages log
        clearLogFile();
        setLogger(loggerItems.fakeLogger);
    });

    function mockBuilder(info: any): OPCUABuilder {
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
    
    it('If message array is empty a warning message is written in the log', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}`;
        await MessageValidator.doPreliminaryValidation(topic, defaultParsedMessage, mockBuilder(processorAndMockedData.mockedData));
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('Messages Array empty in message - check DataSetMessage format');
    });


});
