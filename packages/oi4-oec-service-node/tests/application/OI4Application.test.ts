import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttSettings} from '../../src';
import {OI4Application} from '../../src';
import {
    CDataSetWriterIdLookup,
    EDeviceHealth,
    EPublicationListConfig,
    ESubscriptionListConfig,
    IOI4ApplicationResources,
    NamurNE107Event,
} from '@oi4/oi4-oec-service-model';
import {EOPCUABaseDataType, EOPCUALocale, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {MqttCredentialsHelper} from '../../src';
import {AsyncClientEvents, ResourceType} from '../../src/Utilities/Helpers/Enums';


// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const onEvent = () => jest.fn(async (event, cb) => {
    await cb(event);
});


// eslint-disable-next-line @typescript-eslint/naming-convention
const publish = jest.fn((topic, _) => {
    return topic;
});

const getStandardMqttConfig = (): MqttSettings => {
    return {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };
}

const getResourceInfo = (): IOI4ApplicationResources => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
        oi4Id: '1',
        config: {
            registry: {
                name: {locale: EOPCUALocale.enUS, text: 'reg-01'},
                showRegistry: {
                    value: 'val-showreg-01',
                    type: EOPCUABaseDataType.DateTime,
                    name: {locale: EOPCUALocale.enUS, text: 'showreg-01'}
                },
                developmentMode: {
                    value: 'val-dev-01',
                    type: EOPCUABaseDataType.Number,
                    name: {locale: EOPCUALocale.enUS, text: 'dev-01'}
                }
            },
            logging: {
                auditLevel: {
                    name: {locale: EOPCUALocale.enUS, text: 'audit-01'},
                    value: 'val-01',
                    type: EOPCUABaseDataType.Boolean
                },
                name: {locale: EOPCUALocale.enUS, text: 'login-01'},
                logType: {
                    value: 'val-type-01',
                    type: EOPCUABaseDataType.String,
                    name: {locale: EOPCUALocale.enUS, text: 'type-01'}
                },
                logFileSize: {
                    value: 'val-log-01',
                    type: EOPCUABaseDataType.ByteString,
                    name: {locale: EOPCUALocale.enUS, text: 'log-01'}
                }
            },
            context: {name: {locale: EOPCUALocale.enUS, text: 'config-01'}, description: undefined}
        },
        publicationList: [
            {
                active: true,
                resource: 'health',
                config: EPublicationListConfig.INTERVAL_2,
                DataSetWriterId: 1,
                oi4Identifier: '1'
            },
            {
                active: false,
                resource: 'mam',
                config: EPublicationListConfig.NONE_0,
                DataSetWriterId: 2,
                oi4Identifier: '2'
            },
            {
                active: true,
                resource: 'license',
                config: EPublicationListConfig.STATUS_1,
                DataSetWriterId: 3,
                oi4Identifier: '3'
            }
        ],
        profile: {resource: ['profile', 'b']},
        licenseText: {'a': '1', 'b': '2'},
        license: [
            {
                licenseId: '1', components: [
                    {licAuthors: ['a-01', 'a-02'], component: 'comp-01', licAddText: 'text-a'},
                    {licAuthors: ['b-01', 'b-01'], component: 'comp-02', licAddText: 'text-b'},
                    {licAuthors: ['c-01', 'c-01'], component: 'comp-03', licAddText: 'text-c'},
                ],
            },
            {
                licenseId: '2', components: [
                    {licAuthors: ['aa-01', 'aa-02'], component: 'comp-001', licAddText: 'text-aa'},
                    {licAuthors: ['bb-01', 'bb-01'], component: 'comp-002', licAddText: 'text-bb'},
                    {licAuthors: ['cc-01', 'cc-01'], component: 'comp-003', licAddText: 'text-cc'},
                ],
            }
        ],
        health: {health: EDeviceHealth.NORMAL_0, healthScore: 100},
        mam: {
            DeviceClass: 'oi4',
            ManufacturerUri: 'test',
            Model: {locale: EOPCUALocale.enUS, text: 'text'},
            Description: {locale: EOPCUALocale.enUS, text: 'text'},
            DeviceManual: '',
            Manufacturer: {locale: EOPCUALocale.enUS, text: 'text'},
            HardwareRevision: '1.0',
            ProductCode: '213dq',
            DeviceRevision: '1.0',
            SerialNumber: '23kl41oßmß132',
            SoftwareRevision: '1.0',
            RevisionCounter: 1,
            ProductInstanceUri: 'wo/'
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        dataLookup: {'tag-01': {MessageId: '1'}, 'tag-02': {MessageId: '2'}},
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        metaDataLookup: {'tag-01': {MessageId: 'meta-01'}, 'tag-02': {MessageId: 'meta-02'}},
        subscriptionList: [
            {topicPath: 'path-01', config: ESubscriptionListConfig.CONF_1},
            {topicPath: 'path-02', config: ESubscriptionListConfig.NONE_0},
            {topicPath: 'path-03', config: ESubscriptionListConfig.NONE_0}
        ],
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: jest.fn()
    }
}


describe('OI4MessageBus test', () => {

    beforeAll(() => {
        jest.useFakeTimers();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function, ms: number) => {
            cb();
        });
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(MqttCredentialsHelper.prototype, 'loadUserCredentials').mockReturnValue({
            username: 'test-user',
            password: '1234'
        });
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    on: onEvent()
                }
            }
        );
    });

    afterAll(() => {
        jest.resetModules();
    });

    function getOi4App(): OI4Application {
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        return new OI4Application(resources, mqttOpts);
    }

    it('should trigger all events', async () => {
        const onMock = onEvent();
        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    on: onMock
                }
            }
        );

        getOi4App();
        const events = onMock.mock.calls.map(keyPair => keyPair[0]);
        const setOfEvents = new Set<string>(Object.values(AsyncClientEvents)
            .filter(event => event !== AsyncClientEvents.MESSAGE && event !== AsyncClientEvents.RESOURCE_CHANGED));

        for (const event of events) {
            expect(setOfEvents.has(event)).toBeTruthy();
        }

    });


    it('should trigger resourceChanged', (done) => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const onResourceMock = jest.fn((event, cb) => {
            cb(event);
            expect(event).toBe(AsyncClientEvents.RESOURCE_CHANGED);
            done()
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resources.on = onResourceMock;
        new OI4Application(resources, mqttOpts);
    });

    it('should trigger health from resourceChangedCallback', (done) => {

        const mockSendResource = jest.spyOn(OI4Application.prototype, 'sendResource').mockResolvedValue(undefined);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const onResourceMock = jest.fn((_, cb) => {
            cb(ResourceType.HEALTH);
            expect(mockSendResource).toHaveBeenCalledWith(expect.stringContaining('health'), '', resources.oi4Id);
            mockSendResource.mockRestore();
            done();
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resources.on = onResourceMock;
        new OI4Application(resources, mqttOpts);
    });

    it('should send specific metadata by tagname', async () => {

        const tagName = 'tag-01'
        const oi4Application = getOi4App()
        await oi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/metadata/${tagName}`),
            expect.stringContaining(JSON.stringify({MessageId: 'meta-01'})));
    });

    it('should send all metadata if tagname not specified', async () => {

        const tagName = ''
        const oi4Application = getOi4App()
        await oi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/metadata`),
            expect.stringContaining(JSON.stringify(getResourceInfo().metaDataLookup)));
    });

    it('should send specific data by tagname', async () => {

        const tagName = 'tag-01'
        const oi4Application = getOi4App()
        await oi4Application.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/data/${tagName}`),
            expect.stringContaining(JSON.stringify({MessageId: '1'})));
    });

    it('should send all data if tagname not specified', async () => {

        const tagName = ''
        const oi4Application = getOi4App()
        await oi4Application.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/data`),
            expect.stringContaining(JSON.stringify(getResourceInfo().dataLookup)));
    });

    it('should send resource with valid filter', async () => {

        const filter = '1'
        const oi4Application = getOi4App()
        await oi4Application.sendResource('health', '', filter);
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`),
            expect.stringContaining(JSON.stringify(getResourceInfo().health)));
    });

    it('should not send resource with invalid zero filter', async () => {

        const filter = '0'
        const oi4Application = getOi4App()
        await oi4Application.sendResource('health', '', filter);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    it('should not send resource if page is out of range', async () => {

        const filter = '1'
        const oi4Application = getOi4App()
        await oi4Application.sendResource('health', '', filter, 20, 20);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    async function getPayload(filter: string, resource: string) {
        const oi4Application = getOi4App()
        return await oi4Application.preparePayload(resource, filter);
    }

    it('should prepare mam payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.mam.toString(), 'mam');
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().mam));
    });

    it('should prepare profile payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.profile.toString(), 'profile');
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().profile));
    });

    it('should prepare rt license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.rtLicense.toString(), 'rtLicense');
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().rtLicense));
    });

    it('should prepare health payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.health.toString(), 'health');
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().health));
    });

    it('should prepare license text payload', async () => {
        const filter = 'a';
        const result = await getPayload(filter, 'licenseText');
        expect(JSON.stringify(result.payload[0].Payload))
            .toBe(JSON.stringify({licenseText: getResourceInfo().licenseText[filter]}));
    });

    it('should prepare license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.license.toString(), 'license');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify({components: getResourceInfo().license[i].components}));
        }
    });

    it('should prepare publicationList  payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.publicationList.toString(), 'publicationList');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify(getResourceInfo().publicationList[i]));
        }
    });

    it('should prepare subscriptionList  payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.subscriptionList.toString(), 'subscriptionList');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify(getResourceInfo().subscriptionList[i]));
        }
    });

    it('should  prepare config payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.config.toString(), 'config');
        expect(JSON.stringify(result.payload[0].Payload))
            .toBe(JSON.stringify(getResourceInfo().config));
    });

    it('should not prepare anything if resource not found', async () => {
        const filter = CDataSetWriterIdLookup.config.toString();
        const resource = 'invalid resource';
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        const result = await oi4Application.preparePayload(resource, filter);
        expect(result).toBeUndefined();
    });

    it('should not send resource if error occured in pagination', async () => {
        const mockOPCUABuilder = jest.spyOn(OPCUABuilder.prototype, 'buildPaginatedOPCUANetworkMessageArray').mockReturnValue(undefined);
        const filter = '1'
        const oi4Application = getOi4App()
        jest.clearAllMocks();
        await oi4Application.sendResource('health', '', filter, 1, 20);
        expect(publish).toBeCalledTimes(0);
        mockOPCUABuilder.mockRestore();
    });

    function createEvent(): NamurNE107Event {
        const event = new NamurNE107Event('fakeOrigin', 0, 'fakeDescription');
        event.details = {
            diagnosticCode: 'fakeCode',
            location: 'fakeLocation',
        }
        return event;
    }

    it('should send event', async () => {
        const event = createEvent();
        const oi4Application = getOi4App();
        jest.clearAllMocks();
        await oi4Application.sendEvent(event, '1');

        const expectedPublishAddress = `oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/event/${event.subResource()}/1`;
        expect(publish).toHaveBeenCalled();
        expect(publish.mock.calls[0][0]).toBe(expectedPublishAddress);
    });

});
