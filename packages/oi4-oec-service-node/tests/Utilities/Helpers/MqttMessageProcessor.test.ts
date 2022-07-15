import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {OnSendMetaData} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OI4RegistryManager} from '../../../src';
import EventEmitter from 'events';
import {DataSetClassIds, Resource} from '@oi4/oi4-oec-service-model';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {ProcessorAndMockedData, TestMqttProcessorFactory} from '../../Test-utils/Factories/TestMqttProcessorFactory';
import {MessageFactory} from '../../Test-utils/Factories/MessageFactory';
import {OnSendResource} from '../../../dist/Utilities/Helpers/MqttMessageProcessor';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const clearLogFile: Function = loggerItems.clearLogFile;
    const logContainsOnly: Function = loggerItems.logContainsOnly;
    const logContains: Function = loggerItems.logContains;
    const isLogEmpty: Function = loggerItems.isLogEmpty;

    const defaultMessageItems = MessageFactory.getDefaultMessageItems();
    const defaultTopicPrefix: string = defaultMessageItems.getTopicPrefix();

    const defaultEmitter: EventEmitter = new EventEmitter();

    let processorAndMockedData: ProcessorAndMockedData = undefined;
    let mockedBuilder: OPCUABuilder = undefined;

    beforeEach(() => {
        //Flush the messages log
        clearLogFile();
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        processorAndMockedData = TestMqttProcessorFactory.getProcessorAndDataWithDefaultEmitter(jest.fn(), defaultMessageItems.appId, defaultTopicPrefix);
        mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithMockedMethods(processorAndMockedData.mockedData, defaultMessageItems.appId)
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${defaultMessageItems.appId}`,
        };

        processorAndMockedData = TestMqttProcessorFactory.getProcessorAndDataWithDefaultEmitter(jest.fn(), defaultMessageItems.appId, defaultTopicPrefix);
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockedBuilder);

        expect(logContainsOnly(`Saved registry OI4 ID: ${defaultMessageItems.appId}`)).toBeTruthy();
        expect(OI4RegistryManager.getOi4Id()).toBe(defaultMessageItems.appId);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Utility/${defaultMessageItems.appId}`
        };

        processorAndMockedData.mockedData.fakeTopic = `fake/Utility/${defaultMessageItems.appId}/${TopicMethods.GET}/${Resource.MAM}`
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockedBuilder);

        expect(isLogEmpty()).toBeTruthy();
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('If the serviceType/appID in topic string is not coherent with publisherID in payload, an error is written in the log', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Utility/${defaultMessageItems.appId}`
        };

        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockedBuilder);
        expect(logContainsOnly('Error while processing Mqtt Message: ServiceType/AppID mismatch with Payload PublisherId: [Topic: oi4/Registry/mymanufacturer.com/1/1/1/get/mam - Payload: Utility/mymanufacturer.com/1/1/1]')).toBeTruthy();
    });

    async function processMessage(fakeTopic: string, resource: string, emitter: EventEmitter = defaultEmitter, onSendMetadata: OnSendMetaData = jest.fn(), mockedSendResource: OnSendResource = jest.fn()) {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultMessageItems.appId}`,
        };

        processorAndMockedData = TestMqttProcessorFactory.getProcessorAndDataWithCustomEmitter(mockedSendResource, emitter, defaultMessageItems.appId, defaultTopicPrefix, onSendMetadata);
        processorAndMockedData.mockedData.fakeTopic = fakeTopic;
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockedBuilder);
    }

    async function checkResultGet(resource: string, fakeTopic: string, filter: string = undefined) {
        const mockedSendMessage = jest.fn();
        await processMessage(fakeTopic, resource, defaultEmitter, jest.fn(), mockedSendMessage);
        expect(mockedSendMessage).toHaveBeenCalledWith(resource, undefined, undefined, filter, 0 , 0);
    }

    it('Pub events are ignored', async() => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${TopicMethods.PUB}/${Resource.EVENT}/fakeCategory/${defaultMessageItems.filter}`;
        await processMessage(fakeTopic, Resource.EVENT);
        expect(logContainsOnly('No reaction needed to our own publish event')).toBeTruthy();
    });

    it('extract topic info works without Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set e Del for referenceDesignation basically do nothing
    });

    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION];

        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${resource}/1//1/1`;
            try {
                await checkResultGet(resource, fakeTopic);
            } catch(err:any) {
                expect(logContainsOnly(`Error while processing Mqtt Message: Malformed Oi4Id : ${fakeTopic}`)).toBeTruthy();
                clearLogFile();
            }
        }
    });

    it('extract topic info works - config - get', async() => {
        let fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.CONFIG}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.CONFIG}/${defaultMessageItems.oi4Id}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.CONFIG}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`;
        await checkResultGet(Resource.CONFIG, fakeTopic, defaultMessageItems.filter);
    });

    it('extract topic info works - config - set', async() => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${TopicMethods.SET}/${Resource.CONFIG}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`;

        const mockedSendMessage = jest.fn();
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(fakeTopic, Resource.CONFIG, defaultEmitter, jest.fn(), mockedSendMessage);

        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {origin: defaultMessageItems.appId, number: 0, description: undefined});
        expect(mockedSendMessage).toHaveBeenCalledWith(Resource.CONFIG, undefined, '', defaultMessageItems.filter, 0, 0);
        expect(logContains(`Added ${defaultMessageItems.filter} to config group`)).toBeTruthy();
    });

    async function checkAgainstError(expectedErrorPrefix: string, method: TopicMethods = TopicMethods.SET, resourceConfig: string, oi4Id = defaultMessageItems.oi4Id, topicSuffix = '') {
        const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${method}/${resourceConfig}/${oi4Id}${topicSuffix}`;
        await processMessage(fakeTopic, resourceConfig);
        expect(logContainsOnly(`Error while processing Mqtt Message: ${expectedErrorPrefix}${fakeTopic}`)).toBeTruthy();
        clearLogFile();
    }

    it('extract topic info works - config - if the filter is missing an error is thrown', async() => {
        await checkAgainstError('Invalid filter: ', TopicMethods.SET, Resource.CONFIG, defaultMessageItems.oi4Id, '/');
    });

    async function checkAgainstTopicForData(fakeTopic: string) {
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(fakeTopic, Resource.DATA, defaultEmitter);
        expect(spiedEmit).toHaveBeenCalledWith('getData', {topic: fakeTopic, message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}});
    }

    it('extract topic info works - data - get', async () => {
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.DATA}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.DATA}/${defaultMessageItems.oi4Id}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.DATA}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`);
    });

    it('extract topic info works - data - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${TopicMethods.SET}/${Resource.DATA}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`;
        await processMessage(fakeTopic, Resource.DATA, defaultEmitter);
        expect(logContainsOnly(`Added ${defaultMessageItems.filter} to dataLookup`)).toBeTruthy();
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async() => {
        await checkAgainstError('Invalid filter: ', TopicMethods.SET, Resource.DATA, defaultMessageItems.oi4Id,'/');
    });

    async function checkAgainstTopicForMetaData(fakeTopic: string, filter: string = undefined) {
        const sendMetaData: OnSendMetaData = jest.fn();
        await processMessage(fakeTopic, Resource.METADATA, defaultEmitter, sendMetaData);
        expect(sendMetaData).toHaveBeenCalledWith(filter);
    }

    it('extract topic info works - metadata - get', async () => {
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resource.METADATA}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`, defaultMessageItems.filter);
    });

    it('extract topic info - metadata - topic string has wrong structure, an error is thrown', async () => {
        await checkAgainstError('Invalid topic string structure ', TopicMethods.GET, Resource.METADATA,  defaultMessageItems.oi4Id, '');
        await checkAgainstError('Invalid topic string structure ', TopicMethods.PUB, Resource.METADATA, defaultMessageItems.oi4Id, '');
        await checkAgainstError('Invalid topic string structure ', TopicMethods.GET, Resource.METADATA,'', '');
        await checkAgainstError('Invalid topic string structure ', TopicMethods.PUB, Resource.METADATA, '', '');
        await checkAgainstError('Invalid filter: ', TopicMethods.SET, Resource.METADATA, defaultMessageItems.oi4Id, '/');
    });

    async function testAgainstResourceForLicenseAndLicenseText(resourceConfig: string, fakeTopic: string) {
        const mockedSendMessage = jest.fn();
        await processMessage(fakeTopic, resourceConfig, defaultEmitter, jest.fn(), mockedSendMessage);

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, undefined, undefined, 0, 0);
    }

    it('extract topic info works - license and licenseText - get', async () => {
        const baseFakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}`;

        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}/${defaultMessageItems.oi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}/${defaultMessageItems.oi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}/${defaultMessageItems.oi4Id}/${defaultMessageItems.licenseId}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}/${defaultMessageItems.oi4Id}/${defaultMessageItems.licenseId}`);

        //set LICENSE AND LICENSE TEXT basically does nothing
    });

    it('extract topic info - license and licenseText - if licenseId is missing, an error is thrown', async () => {
        await checkAgainstError('Invalid licenseId: ', TopicMethods.GET, Resource.LICENSE, defaultMessageItems.oi4Id, '/');
        await checkAgainstError('Invalid licenseId: ', TopicMethods.GET, Resource.LICENSE_TEXT, defaultMessageItems.oi4Id, '/');
    });

    async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {
        const fakeTopic = `${defaultTopicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${resourceConfig}/${defaultMessageItems.oi4Id}/${defaultMessageItems.subResource}/${defaultMessageItems.filter}`;

        const mockedSendMessage = jest.fn();
        await processMessage(fakeTopic, resourceConfig, defaultEmitter, jest.fn(), mockedSendMessage);

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, defaultMessageItems.subResource, `${defaultMessageItems.subResource}/${defaultMessageItems.filter}`, 0, 0);
    }

    it('extract topic info works - publicationList and subscriptionList', async () => {
        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.PUBLICATION_LIST);
        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.SUBSCRIPTION_LIST);
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    it('extract topic info - publicationList and subscriptionList - if subresource or tag is missing, an error is thrown', async () => {
        await checkAgainstError('Invalid tag: ',  TopicMethods.SET, Resource.PUBLICATION_LIST, defaultMessageItems.oi4Id, `/${defaultMessageItems.subResource}/`)
        await checkAgainstError('Invalid subresource: ', TopicMethods.SET, Resource.PUBLICATION_LIST, defaultMessageItems.oi4Id, `//${defaultMessageItems.tag}`)

        await checkAgainstError('Invalid tag: ', TopicMethods.SET, Resource.SUBSCRIPTION_LIST, defaultMessageItems.oi4Id, `/${defaultMessageItems.subResource}/`)
        await checkAgainstError('Invalid subresource: ', TopicMethods.SET, Resource.SUBSCRIPTION_LIST, defaultMessageItems.oi4Id, `//${defaultMessageItems.tag}`)
    });

});
