import {
    DataSetClassIds,
    IOPCUANetworkMessage,
    Methods,
    OPCUABuilder,
    Resources,
    ServiceTypes
} from '@oi4/oi4-oec-service-model';
import {LoggerItems, MockedLoggerFactory} from '../testUtils/Factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../testUtils/Factories/MockedOPCUABuilderFactory';
import {MessageValidator} from '../../src/messaging/MessageValidator';
import {MessageFactory, MessageItems} from '../testUtils/Factories/MessageFactory';
import {TopicWrapper} from '@oi4/oi4-oec-service-node';

describe('Unit test for TopicParser', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const logContainsOnly: Function = loggerItems.logContainsOnly;
    const clearLogFile: Function = loggerItems.clearLogFile;

    let defaultParsedMessage: IOPCUANetworkMessage = undefined;
    let defaultMockedBuilder: OPCUABuilder = undefined;
    let defaultMessageItems: MessageItems = undefined;

    beforeEach(() => {
        clearLogFile();
        defaultMessageItems = MessageFactory.getDefaultMessageItems();

        defaultParsedMessage = MessageFactory.getDefaultParsedMessage(defaultMessageItems.publisherId);

        MockedOPCUABuilderFactory.resetAllMocks();
        defaultMockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithMockedMethods(defaultMessageItems.appId, ServiceTypes.AGGREGATION);
    });

    it('If payload messages is empty a message is written n in the log', async () => {
        await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder);
        expect(logContainsOnly('Messages Array empty in message - check DataSetMessage format')).toBeTruthy();
    });

    it('If payload messages are not empty no message is written in in the log', async () => {
        defaultParsedMessage.Messages = [{
            DataSetWriterId: 1,
            Source: 'asd',
            Payload: {}
        }]
        await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder);
        expect(loggerItems.isLogEmpty()).toBeTruthy();
    });

    // TODO refactor to Jest exception assertion
    async function checkAgainstError(caller: Function, errMsg: string): Promise<void> {
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

    it('If the parsed message has the wrong structure, an error is thrown', async () => {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            throw new Error('generic error');
        });

        const errMsg = 'OPC UA validation failed with: generic error';
        await checkAgainstError(async () => await MessageValidator.doPreliminaryValidation(defaultMessageItems.topic, defaultParsedMessage, defaultMockedBuilder), errMsg);
    });

    it('If checkDataSetClassId mismatch, an error is thrown', async () => {
        defaultParsedMessage.DataSetClassId = DataSetClassIds[Resources.CONFIG]
        const errMsg = `DataSetClassId mismatch, got ${defaultParsedMessage.DataSetClassId}, expected ${DataSetClassIds[defaultMessageItems.resource]}`;
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(defaultMessageItems.getDefaultTopicWrapper(), defaultParsedMessage), errMsg);
    });

    it('If topic string is malformed, an error is thrown', async () => {
        const errMsg = `Invalid topic string structure ${defaultMessageItems.topic}`;
        const wrapper: TopicWrapper = defaultMessageItems.getDefaultTopicWrapper();
        wrapper.topicArray = ['', ''];
        // TODO applied recommendation to remove await...was this a good idea?
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['', '', '', '', '', '', '', '', ''];
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', ''];
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);

        wrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(wrapper, defaultParsedMessage), errMsg);
    });

    async function checkAgainstWrongTopicData(newWrapper: TopicWrapper) {
        const errMsg = `Invalid topic string structure ${newWrapper.topicInfo.topic}`;
        await checkAgainstError(async () => MessageValidator.doTopicDataValidation(newWrapper, defaultParsedMessage), errMsg);
    }

    function createCustomMessageInfo(newTopicString: string, method: Methods, resource: Resources) {
        const wrapper: TopicWrapper = defaultMessageItems.getDefaultTopicWrapper();
        wrapper.topicInfo.method = method;
        wrapper.topicInfo.topic = newTopicString;
        wrapper.topicInfo.resource = resource;
        wrapper.topicArray = newTopicString.split('/');
        return wrapper;
    }

    async function createCustomMessageInfoAndTestAgainstWrongData(newTopicString: string, method: Methods, resource: Resources) {
        const wrapper: TopicWrapper = createCustomMessageInfo(newTopicString, method, resource);
        defaultParsedMessage.DataSetClassId = DataSetClassIds[wrapper.topicInfo.resource];
        await checkAgainstWrongTopicData(wrapper);
    }

    it('If the topic path is missing some info, an error is thrown', async () => {
        const standardTopicPrefix = `oi4/${ServiceTypes.REGISTRY}/${defaultMessageItems.appId}`;

        //length = 8
        await createCustomMessageInfoAndTestAgainstWrongData(`${standardTopicPrefix}/${Methods.SET}/${Resources.MAM}`, Methods.SET, Resources.MAM);

        //length = 10
        await createCustomMessageInfoAndTestAgainstWrongData(`${standardTopicPrefix}/${Methods.PUB}/${Resources.MAM}//`, Methods.GET, Resources.MAM);

        //length = 12
        await createCustomMessageInfoAndTestAgainstWrongData(`${standardTopicPrefix}/${Methods.DEL}/${Resources.SUBSCRIPTION_LIST}/${defaultMessageItems.oi4Id}`, Methods.DEL, Resources.SUBSCRIPTION_LIST);

        //length = 13
        await createCustomMessageInfoAndTestAgainstWrongData(`${standardTopicPrefix}/${Methods.GET}/${Resources.MAM}/${defaultMessageItems.oi4Id}/`, Methods.GET, Resources.MAM);

        //length = 14
        await createCustomMessageInfoAndTestAgainstWrongData(`${standardTopicPrefix}/${Methods.GET}/${Resources.MAM}/${defaultMessageItems.oi4Id}//`, Methods.GET, Resources.MAM);
    });

});
