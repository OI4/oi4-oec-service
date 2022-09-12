import {LoggerItems, MockedLoggerFactory} from '../testUtils/Factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../testUtils/Factories/MockedOPCUABuilderFactory';
import {MqttMessageProcessor, OI4RegistryManager} from '../../src';
import {TopicMethods} from '../../src';
import {Oi4Identifier, OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';
import {DataSetClassIds, Resources} from '@oi4/oi4-oec-service-model';
import {MockOi4Application} from '../testUtils/Factories/MockedOi4Application';
import {MockedIApplicationResourceFactory} from '../testUtils/Factories/MockedIApplicationResourceFactory';
import {MqttMessageProcessorEventStatus} from '../../src/messaging/MqttMessageProcessor';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const defaultEmitter: EventEmitter = new EventEmitter();
    const defaultFakeAppId = Oi4Identifier.fromString('mymanufacturer.com/1/1/1');
    const registryFakeAppId = Oi4Identifier.fromString('mymanufacturer.com/1/2/3');
    const defaultFakeSource = 'fakeSource';
    const defaultTopicPrefix = 'oi4/Aggregation';
    const defaultFakeLicenseId = '1234';
    const defaultFakeFilter = 'oi4_pv';
    const defaultFakeOi4Id = Oi4Identifier.fromString('1/1/1/1');
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
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {
            return Promise.resolve('FakeType');
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return Promise.resolve(true)
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

    async function checkResultGet(resource: string, fakeTopic: string, source: string = undefined, filter: string = undefined) {
        oi4Application.sendResource = jest.fn();
        const processor = new MqttMessageProcessor();
        processor.on(MqttMessageProcessorEventStatus.GET_DATA, oi4Application.sendResource);
        await processMessage(fakeTopic, resource, processor);

        expect(oi4Application.sendResource).toHaveBeenCalledWith(resource, undefined, source, filter, 0, 0);
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
        expect(OI4RegistryManager.getOi4Id().toString()).toBe(registryFakeAppId.toString());
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
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resources.EVENT}/fakeCategory/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resources.EVENT);

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
            await checkResultGet(resource, fakeTopic, defaultFakeOi4Id.toString());
        }
    });

    //FIXME find a better way to check for errors
    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation',
        async () => {
            const resources = [Resources.MAM, Resources.HEALTH, Resources.RT_LICENSE, Resources.PROFILE, Resources.REFERENCE_DESIGNATION];

            for (const resource of resources) {
                fakeLogFile.splice(0, fakeLogFile.length);
                const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/1//1/1`;
                await processMessage(fakeTopic, resource).then();
                expect(fakeLogFile.length).toBe(1);
                expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Malformed Oi4Id : oi4/Aggregation/mymanufacturer.com/1/1/1/get/${resource}/1//1/1`);
            }
        });

    it('extract topic info works - config - get', async () => {
        const oi4IdString = defaultFakeOi4Id.toString();
        let fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.CONFIG}`;
        await checkResultGet(Resources.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.CONFIG}/${defaultFakeOi4Id}`;
        await checkResultGet(Resources.CONFIG, fakeTopic, oi4IdString);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;
        await checkResultGet(Resources.CONFIG, fakeTopic, oi4IdString, defaultFakeFilter);
    });

    it('extract topic info works - config - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resources.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        oi4Application.sendResource = jest.fn();
        const processor = new MqttMessageProcessor();

        oi4Application.sendEventStatus = jest.fn();

        await processMessage(fakeTopic, Resources.CONFIG, processor);

        expect(oi4Application.sendEventStatus).toHaveBeenCalledWith( {
            origin: defaultFakeAppId.toString(),
            number: 0,
            description: undefined
        });

        expect(oi4Application.sendResource).toHaveBeenCalledWith(Resources.CONFIG, undefined, defaultFakeAppId.toString(), defaultFakeFilter, 0, 0);
    });

    it('extract topic info works - config - if the filter is missing an error is thrown', async () => {
        await checkAgainstError(Resources.CONFIG, 'Invalid filter', '/');
    });

    // Function works different now
    // it('extract topic info works - data - get', async () => {
    //     async function checkAgainstTopicForData(fakeTopic: string, filter: string) {
    //         const processor = new MqttMessageProcessor();
    //         await processMessage(fakeTopic, Resources.DATA, processor);
    //         expect(oi4Application.sendData).toHaveBeenCalledWith(filter);
    //     }
    //
    //     oi4Application.sendData = jest.fn();
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.DATA}`, undefined);
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.DATA}/${defaultFakeOi4Id}`, undefined);
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`,defaultFakeFilter);
    // });

    it('extract topic info works - data - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.SET}/${Resources.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resources.DATA);
        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe(`Added ${defaultFakeFilter} to dataLookup`);
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async () => {
        await checkAgainstError(Resources.DATA, 'Invalid filter', '/');
    });

    it('extract topic info works - metadata - get', async () => {
       oi4Application.sendMetaData = jest.fn()

        async function checkAgainstTopicForMetaData(fakeTopic: string) {
            await processMessage(fakeTopic, Resources.METADATA);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return oi4Application.sendMetaData;
        }

        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.METADATA}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.METADATA}`);

        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.METADATA}/${defaultFakeOi4Id}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.METADATA}/${defaultFakeOi4Id}`);

        const sendMetaData = await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resources.METADATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);

        expect(sendMetaData).toHaveBeenCalledWith(defaultFakeFilter);
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        await checkAgainstError(Resources.METADATA, 'Invalid filter', '/');
    });

    it('extract topic info works - license and licenseText - get', async () => {
        async function testAgainstResourceForLicenseAndLicenseText(resourceConfig: string, fakeTopic: string, source?: string, filter?:string) {
            oi4Application.sendResource = jest.fn();
            await processMessage(fakeTopic, resourceConfig);

            // TODO handle event emitter
            expect(oi4Application.sendResource).toHaveBeenCalledWith(resourceConfig, undefined, source?.toString(), filter, 0, 0);
        }

        const baseFakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}`;

        const oi4IdString = defaultFakeOi4Id.toString();

        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE, `${baseFakeTopic}/${Resources.LICENSE}`);
        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE_TEXT, `${baseFakeTopic}/${Resources.LICENSE_TEXT}`);
        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE, `${baseFakeTopic}/${Resources.LICENSE}/${defaultFakeOi4Id}`, oi4IdString);
        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE_TEXT, `${baseFakeTopic}/${Resources.LICENSE_TEXT}/${defaultFakeOi4Id}`, oi4IdString);
        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE, `${baseFakeTopic}/${Resources.LICENSE}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`, oi4IdString, defaultFakeLicenseId);
        await testAgainstResourceForLicenseAndLicenseText(Resources.LICENSE_TEXT, `${baseFakeTopic}/${Resources.LICENSE_TEXT}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`, oi4IdString, defaultFakeLicenseId);

        //set LICENSE AND LICENSE TEXT basically does nothing
    });

    it('extract topic info - license and licenseText - if licenseId is missing, an error is thrown', async () => {
        await checkAgainstError(Resources.LICENSE, 'Invalid licenseId', '/', TopicMethods.GET);
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.LICENSE_TEXT, 'Invalid licenseId', '/', TopicMethods.GET);
    });

    it('extract topic info works - publicationList and subscriptionList', async () => {
        async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {
            const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFakeSource}/${defaultFakeFilter}`;
            oi4Application.sendResource = jest.fn();
            await processMessage(topic, resourceConfig);
            expect(oi4Application.sendResource).toHaveBeenCalledWith(resourceConfig, undefined, defaultFakeOi4Id.toString(), defaultFakeFilter, 0, 0);
        }

        await testAgainstResourceForPublicationAndSubscriptionLists(Resources.PUBLICATION_LIST);
        await testAgainstResourceForPublicationAndSubscriptionLists(Resources.SUBSCRIPTION_LIST);
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    it('extract topic info - publicationList and subscriptionList - if source or tag is missing, an error is thrown', async () => {
        await checkAgainstError(Resources.PUBLICATION_LIST, 'Invalid tag', `/${defaultFakeSource}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.PUBLICATION_LIST, 'Invalid source', `//${defaultFakeTag}`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.SUBSCRIPTION_LIST, 'Invalid tag', `/${defaultFakeSource}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.SUBSCRIPTION_LIST, 'Invalid source', `//${defaultFakeTag}`)
    });

});
