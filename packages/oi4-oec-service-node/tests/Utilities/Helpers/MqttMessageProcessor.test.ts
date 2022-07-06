import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MqttMessageProcessor} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {OI4RegistryManager} from '../../../src';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';
import {DataSetClassIds, Resource} from '@oi4/oi4-oec-service-model';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    const defaultEmitter: EventEmitter = new EventEmitter();
    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    const defaultFakeSubResource = 'fakeSubResource';
    const defaultTopicPrefix = 'fake/fictitious';
    const defaultFakeLicenseId = '1234';
    const defaultFakeFilter = 'oi4_pv';
    const defaultFakeOi4Id = '1/1/1/1';
    const defaultFakeTag = 'tag';

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData() {
        return {
            fakeOi4Id: defaultFakeAppId,
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/mam/${defaultFakeFilter}`,
        }
    }

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

    function getMqttProcessorAndMockedData(mockedSendData: Function, emitter: EventEmitter = defaultEmitter, sendMetaData: Function = jest.fn()): any {
        const mockedData = getMockedData();
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeAppId;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendData, emitter),
            mockedData: mockedData,
        }
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${defaultFakeAppId}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${defaultFakeAppId}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(defaultFakeAppId);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Mocked/Fake'
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(0);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    async function processMessage(mockedSendMessage: Function, fakeTopic: string, resource: string, emitter: EventEmitter = defaultEmitter, sendMetaData: Function = jest.fn()) {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultFakeAppId}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(mockedSendMessage, emitter, sendMetaData);
        processorAndMockedData.mockedData.fakeTopic = fakeTopic;
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));
    }

    async function checkResultGet(resource: string, fakeTopic: string, filter: string = undefined, emitter: EventEmitter = defaultEmitter) {
        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resource, emitter);
        expect(mockedSendMessage).toHaveBeenCalledWith(resource, undefined, undefined, filter, 0 , 0);
    }

    it('Pub events are ignored', async() => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/fakeCategory/${defaultFakeFilter}`;

        await processMessage(jest.fn(), fakeTopic, Resource.CONFIG, defaultEmitter);

        expect(fakeLogFile[0]).toBe(`No reaction needed to our own publication messages${fakeTopic.substring(fakeTopic.indexOf(`/${TopicMethods.PUB}/`), fakeTopic.length)}`);
    });

    it('extract topic info works without Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set e Del for referenceDesignation basically do nothing
    });

    it('extract topic info works with Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/${defaultFakeOi4Id}`;
            await checkResultGet(resource, fakeTopic);
        }
    });

    //FIXME find a better way to check for errors
    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        let errorArrived = false;

        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/1//1/1`;
            try {
                await checkResultGet(resource, fakeTopic);
            } catch(err:any) {
                expect(err.message).toBe(`Malformed Oi4Id : ${fakeTopic}`);
                errorArrived = true;
            }

            expect(errorArrived).toBeTruthy();
            errorArrived = false;
        }
    });

    it('extract topic info works - config - get', async() => {
        let fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;
        await checkResultGet(Resource.CONFIG, fakeTopic, defaultFakeFilter);
    });

    it('extract topic info works - config - set', async() => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resource.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        const mockedSendMessage = jest.fn();
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(mockedSendMessage, fakeTopic, Resource.CONFIG, defaultEmitter);

        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {origin: defaultFakeAppId, number: 0, description: undefined});
        expect(mockedSendMessage).toHaveBeenCalledWith(Resource.CONFIG, undefined, defaultFakeFilter);
        expect(fakeLogFile[0]).toBe(`Added ${defaultFakeFilter} to config group`);
    });

    async function checkAgainstError(resourceConfig: string, errorPrefix: string, topicSuffix = '') {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${resourceConfig}/${defaultFakeOi4Id}${topicSuffix}`;
        await expect(processMessage(jest.fn(), fakeTopic, resourceConfig, new EventEmitter())).rejects.toThrowError(`${errorPrefix}${fakeTopic}`);
    }

    it('extract topic info works - config - if the filter is missing an error is thrown', async() => {
        await checkAgainstError(Resource.CONFIG, 'Invalid filter: ', '/');
    });

    async function checkAgainstTopicForData(fakeTopic: string) {
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(jest.fn(), fakeTopic, Resource.DATA, defaultEmitter);
        expect(spiedEmit).toHaveBeenCalledWith('getData', {topic: fakeTopic, message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}});
    }

    it('extract topic info works - data - get', async () => {
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
    });

    it('extract topic info works - data - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resource.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        await processMessage(jest.fn(), fakeTopic, Resource.DATA, defaultEmitter);
        expect(fakeLogFile[0]).toBe(`Added ${defaultFakeFilter} to dataLookup`);
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async() => {
        await checkAgainstError(Resource.DATA, 'Invalid filter: ', '/');
    });

    async function checkAgainstTopicForMetaData(fakeTopic: string, filter: string = undefined) {
        const sendMetaData: Function = jest.fn();
        await processMessage(jest.fn(), fakeTopic, Resource.METADATA, defaultEmitter, sendMetaData);
        expect(sendMetaData).toHaveBeenCalledWith(filter);
    }

    it('extract topic info works - metadata - get', async () => {
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}`);
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}`);
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`, defaultFakeFilter);
        //set metadata basically does nothing
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        await checkAgainstError(Resource.METADATA, 'Invalid filter: ', '/');
    });

    async function testAgainstResourceForLicenseAndLicenseText(resourceConfig: string, fakeTopic: string) {
        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, undefined, undefined, 0, 0);
    }

    it('extract topic info works - license and licenseText - get', async () => {
        const baseFakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}`;

        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}/${defaultFakeOi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}/${defaultFakeOi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE, `${baseFakeTopic}/${Resource.LICENSE}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`);
        await testAgainstResourceForLicenseAndLicenseText(Resource.LICENSE_TEXT, `${baseFakeTopic}/${Resource.LICENSE_TEXT}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`);

        //set LICENSE AND LICENSE TEXT basically does nothing
    });

    it('extract topic info - license and licenseText - if licenseId is missing, an error is thrown', async () => {
        await checkAgainstError(Resource.LICENSE, 'Invalid licenseId: ', '/');
        await checkAgainstError(Resource.LICENSE_TEXT ,'Invalid licenseId: ', '/');
    });

    async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {

        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFakeSubResource}/${defaultFakeFilter}`;

        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, defaultFakeSubResource, undefined, 0, 0);
    }

    it('extract topic info works - publicationList and subscriptionList', async () => {
        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.PUBLICATION_LIST);
        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.SUBSCRIPTION_LIST);
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    it('extract topic info - publicationList and subscriptionList - if subresource or tag is missing, an error is thrown', async () => {
        await checkAgainstError(Resource.PUBLICATION_LIST, 'Invalid Resource/tag: ', `/${defaultFakeSubResource}/`)
        await checkAgainstError(Resource.PUBLICATION_LIST, 'Invalid Resource/tag: ', `//${defaultFakeTag}`)

        await checkAgainstError(Resource.SUBSCRIPTION_LIST, 'Invalid Resource/tag: ', `/${defaultFakeSubResource}/`)
        await checkAgainstError(Resource.SUBSCRIPTION_LIST, 'Invalid Resource/tag: ', `//${defaultFakeTag}`)
    });

});
