import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MqttMessageProcessor, OI4RegistryManager} from '../../../src';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';
import {DataSetClassIds, Resource} from '@oi4/oi4-oec-service-model';
import {MockOi4Application} from '../../Test-utils/Factories/MockedOi4Application';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {MqttMessageProcessorEventStatus} from "../../../dist/Utilities/Helpers/MqttMessageProcessor";

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    const defaultEmitter: EventEmitter = new EventEmitter();
    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    const registryFakeAppId = 'mymanufacturer.com/1/2/3';
    const defaultFakeSubResource = 'fakeSubResource';
    const defaultTopicPrefix = 'oi4/Aggregation';
    const defaultFakeLicenseId = '1234';
    const defaultFakeFilter = 'oi4_pv';
    const defaultFakeOi4Id = '1/1/1/1';
    const defaultFakeTag = 'tag';

    const mam = MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel('mymanufacturer.com', '1', '1', '1');
    const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance(mam);
    const oi4Application = new MockOi4Application(applicationResource, ServiceTypes.AGGREGATION);

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData() {
        return {
            oi4Id: defaultFakeAppId,
            serviceType: ServiceTypes.AGGREGATION,
            topic: `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/mam/${defaultFakeFilter}`,
        }
    }

    function mockBuilder(serviceType: ServiceTypes): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {
            return Promise.resolve('FakeType');
        });

        return MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(defaultFakeAppId, serviceType);
    }

    async function processMessage(fakeTopic: string, resource: string, processor = new MqttMessageProcessor()) { //, emitter: EventEmitter = defaultEmitter) {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultFakeAppId}`,
        };

        const mockedData = getMockedData();
        mockedData.topic = fakeTopic;
        await processor.processMqttMessage(mockedData.topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);
    }

    async function checkResultGet(resource: string, fakeTopic: string, filter: string = undefined) {
        const mockedSendMessage = jest.fn();
        const processor = new MqttMessageProcessor();
        processor.on(MqttMessageProcessorEventStatus.GET_DATA, mockedSendMessage);
        await processMessage(fakeTopic, resource, processor);

        expect(mockedSendMessage).toHaveBeenCalledWith(resource, undefined, undefined, filter, 0, 0);
    }

    async function checkAgainstError(resourceConfig: string, errorPrefix: string, topicSuffix = '', method = TopicMethods.SET) {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${method}/${resourceConfig}/${defaultFakeOi4Id}${topicSuffix}`;
        await processMessage(fakeTopic, resourceConfig);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: ${errorPrefix}: ${fakeTopic}`);
        //await expect(processMessage(jest.fn(), fakeTopic, resourceConfig, new EventEmitter())).rejects.toThrowError(`${errorPrefix}${fakeTopic}`);
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${registryFakeAppId}`,
        };
        const topic = `oi4/${jsonObj.PublisherId}/${TopicMethods.GET}/mam/${defaultFakeOi4Id}`;
        const mockedData = getMockedData();
        const processor = new MqttMessageProcessor();
        await processor.processMqttMessage(topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);

        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${registryFakeAppId}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(registryFakeAppId);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Mocked/${registryFakeAppId}`
        };
        const topic = `oi4/${jsonObj.PublisherId}/${TopicMethods.GET}/mam/${defaultFakeFilter}`;

        const mockedData = getMockedData();
        const processor = new MqttMessageProcessor();
        await processor.processMqttMessage(topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);

        expect(fakeLogFile.length).toBe(1);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('Pub events are ignored', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/fakeCategory/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resource.EVENT);

        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe('No reaction needed to our own publish event');
    });

    it('extract topic info works without Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set and Del for referenceDesignation basically do nothing
    });

    it('extract topic info works with Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/${defaultFakeOi4Id}`;
            await checkResultGet(resource, fakeTopic);
        }
    });

    //FIXME find a better way to check for errors
    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation',
        async () => {
            const resources = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION];

            for (const resource of resources) {
                fakeLogFile.splice(0, fakeLogFile.length);
                const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/1//1/1`;
                await processMessage(fakeTopic, resource).then();
                expect(fakeLogFile.length).toBe(1);
                expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Malformed Oi4Id : oi4/Aggregation/mymanufacturer.com/1/1/1/get/${resource}/1//1/1`);
            }
        });

    it('extract topic info works - config - get', async () => {
        let fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}`;
        await checkResultGet(Resource.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;
        await checkResultGet(Resource.CONFIG, fakeTopic, defaultFakeFilter);
    });

    it('extract topic info works - config - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resource.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        const mockedSendMessage = jest.fn();
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(fakeTopic, Resource.CONFIG);

        // TODO handle event emitter

        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {
            origin: defaultFakeAppId,
            number: 0,
            description: undefined
        });
        expect(mockedSendMessage).toHaveBeenCalledWith(Resource.CONFIG, undefined, '', defaultFakeFilter, 0, 0);
        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe(`Added ${defaultFakeFilter} to config group`);
    });

    it('extract topic info works - config - if the filter is missing an error is thrown', async () => {
        await checkAgainstError(Resource.CONFIG, 'Invalid filter', '/');
    });


    it('extract topic info works - data - get', async () => {
        async function checkAgainstTopicForData(fakeTopic: string) {
            const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
            await processMessage(fakeTopic, Resource.DATA);
            expect(spiedEmit).toHaveBeenCalledWith('getData', {
                topic: fakeTopic,
                message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}
            });
        }

        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}`);
        await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
    });

    it('extract topic info works - data - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resource.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resource.DATA);
        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe(`Added ${defaultFakeFilter} to dataLookup`);
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async () => {
        await checkAgainstError(Resource.DATA, 'Invalid filter', '/');
    });

    it('extract topic info works - metadata - get', async () => {
        // TODO check the ignore flag
        // @ts-ignore
        async function checkAgainstTopicForMetaData(fakeTopic: string) {
            await processMessage(fakeTopic, Resource.METADATA);
            return sendMetaData;
        }

        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}`);

        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}`);

        // TODO check the ignore flag
        // @ts-ignore
        const sendMetaData = await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
        expect(sendMetaData).toHaveBeenCalledWith(defaultFakeFilter);
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        await checkAgainstError(Resource.METADATA, 'Invalid filter', '/');
    });

    it('extract topic info works - license and licenseText - get', async () => {
        async function testAgainstResourceForLicenseAndLicenseText(resourceConfig: string, fakeTopic: string) {
            const mockedSendMessage = jest.fn();
            await processMessage(fakeTopic, resourceConfig);

            // TODO handle event emitter

            expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, undefined, undefined, 0, 0);
        }

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
        await checkAgainstError(Resource.LICENSE, 'Invalid licenseId', '/', TopicMethods.GET);
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resource.LICENSE_TEXT, 'Invalid licenseId', '/', TopicMethods.GET);
    });

    it('extract topic info works - publicationList and subscriptionList', async () => {
        async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {
            const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFakeSubResource}/${defaultFakeFilter}`;

            const mockedSendMessage = jest.fn();
            await processMessage(topic, resourceConfig);

            // TODO handle event emitter

            expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, defaultFakeSubResource, `${defaultFakeSubResource}/${defaultFakeFilter}`, 0, 0);
        }

        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.PUBLICATION_LIST);
        await testAgainstResourceForPublicationAndSubscriptionLists(Resource.SUBSCRIPTION_LIST);
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    it('extract topic info - publicationList and subscriptionList - if subresource or tag is missing, an error is thrown', async () => {
        await checkAgainstError(Resource.PUBLICATION_LIST, 'Invalid tag', `/${defaultFakeSubResource}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resource.PUBLICATION_LIST, 'Invalid subresource', `//${defaultFakeTag}`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resource.SUBSCRIPTION_LIST, 'Invalid tag', `/${defaultFakeSubResource}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resource.SUBSCRIPTION_LIST, 'Invalid subresource', `//${defaultFakeTag}`)
    });

});
