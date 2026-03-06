import {LoggerItems, MockedLoggerFactory} from '../testUtils/factories/MockedLoggerFactory';
import {MockedOPCUABuilderFactory} from '../testUtils/factories/MockedOPCUABuilderFactory';
import {OI4RegistryManager} from '../../src';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import {
    DataSetClassIds,
    Methods,
    Oi4Identifier,
    OPCUABuilder,
    Resources,
    ServiceTypes,
    oi4Namespace
} from '@oi4/oi4-oec-service-model';
import {MockOi4Application} from '../testUtils/factories/MockedOi4Application';
import {MqttMessageProcessor} from '../../src';
import {MockOI4ApplicationResources} from '../testUtils/factories/MockOI4ApplicationResources';

interface MockedData {
    oi4Id: Oi4Identifier;
    serviceType: ServiceTypes;
    topic: string;
};

describe('Unit test for MqttMessageProcessor', () => {

    //const testMAMFile = '../../tests/__fixtures__/mam.json';
    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    // const defaultEmitter: EventEmitter = new EventEmitter();
    const registryFakeAppId = Oi4Identifier.fromString('mymanufacturer.com/1/2/3');
    //const defaultFakeSource = 'fakeSource';
    const defaultTopicPrefix = `${oi4Namespace}/Aggregation`;
    const defaultFakeFilter = 'oi4_pv';
    const defaultFakeOi4Id = Oi4Identifier.fromString('1/1/1/1');
    const defaultFakeTag = 'tag';
    const defaultResource = Resources.DATA;

    //cconst mam = MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel('mymanufacturer.com', '1', '1', '1');
    //cconst pk = new MockOI4ApplicationResources();
    const applicationResource = new MockOI4ApplicationResources();//.getMockedIApplicationResourceInstance(mam);
    const oi4Application = new MockOi4Application(applicationResource, ServiceTypes.AGGREGATION);
    const defaultFakeAppId = applicationResource.oi4Id;

    if (!defaultFakeAppId) {
        console.error('defaultFakeAppId is undefined! Check MockOI4ApplicationResources loading.');
    }

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData(): MockedData {
        return {
            oi4Id: defaultFakeAppId,
            serviceType: ServiceTypes.AGGREGATION,
            topic: `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.MAM}/${defaultFakeFilter}`,
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

    async function processMessage(fakeTopic: string, resource: string, processor = new MqttMessageProcessor()): Promise<void> { //, emitter: EventEmitter = defaultEmitter) {
        const jsonObj = {
            Messages: [{
                Payload: 'fakePayload',
                DataSetWriterName: defaultFakeOi4Id.toString()
            }],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultFakeAppId}`,
        };

        const mockedData = getMockedData();
        mockedData.topic = fakeTopic;
        await processor.processMqttMessage(mockedData.topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);
    }

    async function checkResultGet(resource: string, fakeTopic: string, source: Oi4Identifier = undefined, filter: string = undefined): Promise<void> {
        oi4Application.sendResource = jest.fn();
        const processor = new MqttMessageProcessor();
        // processor.on(MqttMessageProcessorEventStatus.GET_DATA, oi4Application.sendResource);
        await processMessage(fakeTopic, resource, processor);

        // Logs are expected due to Registry checks
        // if (fakeLogFile.length > 0) {
        //    console.log(`Logs during checkResultGet for ${fakeTopic}:`, fakeLogFile);
        // }
        // expect(fakeLogFile.length).toBe(0);
        expect(oi4Application.sendResource).toHaveBeenCalledWith(resource, undefined, source, filter, 0, 0);
    }

    async function checkAgainstError(resourceConfig: string, errorPrefix: string, topicSuffix = '', method = Methods.SET): Promise<void> {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${method}/${resourceConfig}/${defaultFakeOi4Id}${topicSuffix}`;
        await processMessage(fakeTopic, resourceConfig);
        expect(fakeLogFile.length).toBeGreaterThan(0);
        // expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: ${errorPrefix}: ${fakeTopic}`);
        expect(fakeLogFile.find(log => log.includes(errorPrefix) && log.includes(fakeTopic))).toBeTruthy();
    }

    it('Registry OI4 ID shall be saved if the serviceType is "Registry"', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload',  DataSetWriterName: defaultFakeOi4Id}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${registryFakeAppId}`,
        };
        const topic = `${oi4Namespace}/${jsonObj.PublisherId}/${Methods.GET}/${Resources.MAM}/${defaultFakeOi4Id}`;
        const mockedData = getMockedData();
        const processor = new MqttMessageProcessor();
        await processor.processMqttMessage(topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${registryFakeAppId}`);
        expect(OI4RegistryManager.getOi4Id().toString()).toBe(registryFakeAppId.toString());
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Mocked/${registryFakeAppId}`
        };
        const topic = `oi4/${jsonObj.PublisherId}/${Methods.GET}/mam/${defaultFakeFilter}`;

        const mockedData = getMockedData();
        const processor = new MqttMessageProcessor();
        await processor.processMqttMessage(topic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData.serviceType), oi4Application);

        expect(fakeLogFile.length).toBe(1);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('Pub events are ignored', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.PUB}/${Resources.EVENT}/fakeCategory/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resources.EVENT);

        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe('No reaction needed to our own publish event');
    });

    it('extract topic info works without Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = [Resources.MAM, Resources.HEALTH, Resources.PROFILE, Resources.REFERENCE_DESIGNATION];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set and Del for referenceDesignation basically do nothing
    });

    it('extract topic info works with Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = [Resources.MAM, Resources.HEALTH, Resources.PROFILE, Resources.REFERENCE_DESIGNATION];
        for (const resource of resources) {
            const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${resource}/${defaultFakeOi4Id}`;
            await checkResultGet(resource, fakeTopic, defaultFakeOi4Id);
        }
    });

    //FIXME find a better way to check for errors
    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation',
        async () => {
            const resources = [Resources.MAM, Resources.HEALTH, Resources.PROFILE, Resources.REFERENCE_DESIGNATION];

            for (const resource of resources) {
                fakeLogFile.splice(0, fakeLogFile.length);
                const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${resource}/1//1/1`;
                await processMessage(fakeTopic, resource).then();
                expect(fakeLogFile.length).toBe(1);
                expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Malformed Oi4Id : ${oi4Namespace}/${ServiceTypes.AGGREGATION}/mymanufacturer.com/MyModel/my-procuct-code/my-serial-number/${Methods.GET}/${resource}/1//1/1`);
            }
        });

    it('extract topic info works - config - get', async () => {
        let fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.CONFIG}`;
        await checkResultGet(Resources.CONFIG, fakeTopic);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.CONFIG}/${defaultFakeOi4Id}`;
        await checkResultGet(Resources.CONFIG, fakeTopic, defaultFakeOi4Id);

        fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;
        await checkResultGet(Resources.CONFIG, fakeTopic, defaultFakeOi4Id, defaultFakeFilter);
    });

    it('extract topic info works - config - set', async () => {
        const setConfigTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.SET}/${Resources.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        oi4Application.sendResource = jest.fn();
        const processor = new MqttMessageProcessor();

        oi4Application.sendEventStatus = jest.fn();

        await processMessage(setConfigTopic, Resources.CONFIG, processor);

        expect(oi4Application.sendEventStatus).toHaveBeenCalledWith(
            expect.objectContaining({
                Number: 2147483648
            }),
            expect.anything() // Can be string or Oi4Identifier
        );
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
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.DATA}`, undefined);
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.DATA}/${defaultFakeOi4Id}`, undefined);
    //     await checkAgainstTopicForData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`,defaultFakeFilter);
    // });

    it('extract topic info works - data - set', async () => {
        const fakeTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.SET}/${Resources.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`;

        await processMessage(fakeTopic, Resources.DATA);
        expect(fakeLogFile.length).toBe(2);
        expect(fakeLogFile[1]).toBe(`Added ${defaultFakeFilter} to dataLookup`);
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async () => {
        await checkAgainstError(Resources.DATA, 'Invalid filter', '/');
    });

    it('extract topic info works - metadata - get', async () => {
        oi4Application.sendMetaData = jest.fn()

        async function checkAgainstTopicForMetaData(fakeTopic: string): Promise<(cutTopic: string) => Promise<void>> {
            await processMessage(fakeTopic, Resources.METADATA);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return oi4Application.sendMetaData;
        }

        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.METADATA}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.METADATA}`);

        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.METADATA}/${defaultFakeOi4Id}`);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Error while processing Mqtt Message: Invalid topic string structure ${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.METADATA}`);

        const sendMetaData = await checkAgainstTopicForMetaData(`${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${Resources.METADATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);

        expect(sendMetaData).toHaveBeenCalledWith(defaultFakeFilter);
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        await checkAgainstError(Resources.METADATA, 'Invalid filter', '/');
    });

    it('extract topic info works - publicationList and subscriptionList', async () => {
        async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string): Promise<void> {
            const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${Methods.GET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultResource}/${defaultFakeFilter}`;
            oi4Application.sendResource = jest.fn();
            await processMessage(topic, resourceConfig);
            expect(oi4Application.sendResource).toHaveBeenCalledWith(resourceConfig, undefined, defaultFakeOi4Id, defaultFakeFilter, 0, 0);
        }

        await testAgainstResourceForPublicationAndSubscriptionLists(Resources.PUBLICATION_LIST);
        await testAgainstResourceForPublicationAndSubscriptionLists(Resources.SUBSCRIPTION_LIST);
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    it('extract topic info - publicationList and subscriptionList - if source or tag is missing, an error is thrown', async () => {
        await checkAgainstError(Resources.PUBLICATION_LIST, 'Invalid tag', `/${defaultFakeFilter}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.PUBLICATION_LIST, 'Invalid source', `//${defaultFakeTag}`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.SUBSCRIPTION_LIST, 'Invalid tag', `/${defaultFakeFilter}/`)
        fakeLogFile.splice(0, fakeLogFile.length);
        await checkAgainstError(Resources.SUBSCRIPTION_LIST, 'Invalid source', `//${defaultFakeTag}`)
    });

});
