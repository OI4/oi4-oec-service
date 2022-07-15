import {DataSetClassIds, Resource} from '@oi4/oi4-oec-service-model';
import {IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {MessageValidator} from '../../../src/Utilities/Helpers/MessageValidator';
import {MessageFactory, MessageItems} from '../../Test-utils/Factories/MessageFactory';
import {TopicWrapper} from '../../../dist/Utilities/Helpers/Types';
import {ProcessorAndMockedData, TestMqttProcessorFactory} from '../../Test-utils/Factories/TestMqttProcessorFactory';

describe('Unit test for TopicParser', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const logContainsOnly: Function = loggerItems.logContainsOnly;
    const clearLogFile: Function = loggerItems.clearLogFile;

    let processorAndMockedData: ProcessorAndMockedData = undefined;
    let defaultParsedMessage: IOPCUANetworkMessage = undefined;
    let defaultMockedBuilder: OPCUABuilder = undefined;
    let defaultMessageItems: MessageItems = undefined;

    beforeEach(() => {
        clearLogFile();
        defaultMessageItems = MessageFactory.getDefaultMessageItems();

        defaultParsedMessage = MessageFactory.getDefaultParsedMessage(defaultMessageItems.publisherId);
        processorAndMockedData = TestMqttProcessorFactory.getProcessorAndDataWithDefaultEmitter(jest.fn(), defaultMessageItems.appId, defaultMessageItems.getTopicPrefix());

        MockedOPCUABuilderFactory.resetAllMocks();
        defaultMockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithMockedMethods(processorAndMockedData.mockedData, defaultMessageItems.appId)
    });

    it('If payload messages is empty a message is written n in the log', async () => {
        await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder);
        expect(logContainsOnly('Messages Array empty in message - check DataSetMessage format')).toBeTruthy();
    });

    it('If payload messages are not empty no message is written in in the log', async () => {
        defaultParsedMessage.Messages = [{
            DataSetWriterId: 1,
            subResource: 'asd',
            Payload: {}}]
        await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder);
        expect(loggerItems.isLogEmpty()).toBeTruthy();
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

    it('If the topic string is fine, no error is thrown', async () => {
        await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder);
        MessageValidator.doTopicDataValidation(defaultMessageItems.getDefaultTopicWrapper(), defaultParsedMessage);
    });

    it('If the publisher ID does not match, an error is thrown', async () => {
        defaultParsedMessage.PublisherId = 'fake/moreFake'
        const errMsg = `ServiceType/AppID mismatch with Payload PublisherId: [Topic: ${defaultMessageItems.topic} - Payload: ${defaultParsedMessage.PublisherId}]`;
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If the parsed message has the wrong structure, an error is thrown', async () => {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            throw new Error('generic error');
        });

        const errMsg = 'OPC UA validation failed with: generic error';
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If checkDataSetClassId mismatch, an error is thrown', async () => {
        defaultParsedMessage.DataSetClassId = DataSetClassIds[Resource.CONFIG]
        const errMsg = `DataSetClassId mismatch, got ${defaultParsedMessage.DataSetClassId}, expected ${DataSetClassIds[defaultMessageItems.resource]}`;
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(defaultMessageItems.getDefaultTopicWrapper(), defaultParsedMessage), errMsg);
    });

    it('If topic string is malformed, an error is thrown', async () => {
        const errMsg = `Invalid topic string structure ${defaultMessageItems.topic}`;
        const wrapper: TopicWrapper = defaultMessageItems.getDefaultTopicWrapper();
        wrapper.topicArray = ['',''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['','','','','','','','', ''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['','','','','','','','','','', ''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['','','','','','','','','','','','','','','','','','','',''];
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);
    });
/*
    async function checkAgainstWrongTopicData(newWrapper: TopicWrapper) {
        const errMsg = `Invalid topic string structure ${newWrapper.topicInfo.topic}`;
        await checkAgainstError(async () => await MessageValidator.doTopicDataValidation(newWrapper, defaultParsedMessage), errMsg);
    }

    function updateMessageInfo(newTopicString: string, method: TopicMethods) {
        const wrapper: TopicWrapper = defaultMessageItems.getDefaultTopicWrapper();
        wrapper.topicInfo.method = method;
        wrapper.topicInfo.topic = newTopicString;
        wrapper.topicArray = newTopicString.split('/');
        return wrapper;
    }

    it('If the topic path is missing some info, an error is thrown', async () => {
        const standardTopicPrefix = `oi4/${ServiceTypes.REGISTRY}/${defaultMessageItems.appId}`;
        const newWrapper: TopicWrapper = updateMessageInfo(`${standardTopicPrefix}/${TopicMethods.SET}/${Resource.MAM}`, TopicMethods.SET);
        await checkAgainstWrongTopicData(newWrapper);
    });
*/
});
