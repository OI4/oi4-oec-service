import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4Application} from '../../src';
import {
    Application,
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    EPublicationListConfig,
    ESubscriptionListConfig,
    EventCategory,
    Health,
    IOI4ApplicationResources,
    License, LicenseText,
    MasterAssetModel,
    NamurNE107Event,
    Profile, PublicationList, Resource,
    RTLicense,
    StatusEvent,
} from '@oi4/oi4-oec-service-model';
import {
    EOPCUABaseDataType,
    EOPCUALocale, EOPCUAMessageType,
    EOPCUAStatusCode,
    IOPCUANetworkMessage,
    OPCUABuilder
} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {AsyncClientEvents} from '../../src/Utilities/Helpers/Enums';
import EventEmitter from 'events';


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
    const licenseText = new Map<string, LicenseText>();
    licenseText.set('a', LicenseText.clone({licenseText: '1'} as LicenseText));
    licenseText.set('b', LicenseText.clone({licenseText: '2'} as LicenseText));

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
            PublicationList.clone({
                active: true,
                resource: 'health',
                config: EPublicationListConfig.INTERVAL_2,
                DataSetWriterId: 1,
                oi4Identifier: '1'
            } as PublicationList),
            PublicationList.clone({
                active: false,
                resource: 'mam',
                config: EPublicationListConfig.NONE_0,
                DataSetWriterId: 2,
                oi4Identifier: '2'
            } as PublicationList),
            PublicationList.clone({
                active: true,
                resource: 'license',
                config: EPublicationListConfig.STATUS_1,
                DataSetWriterId: 3,
                oi4Identifier: '3'
            } as PublicationList)
        ],
        profile: new Profile(Application.mandatory),
        licenseText: licenseText,
        license: [
            new License('1', [
                    {licAuthors: ['a-01', 'a-02'], component: 'comp-01', licAddText: 'text-a'},
                    {licAuthors: ['b-01', 'b-01'], component: 'comp-02', licAddText: 'text-b'},
                    {licAuthors: ['c-01', 'c-01'], component: 'comp-03', licAddText: 'text-c'},
                ]
            ),
            new License('2', [
                    {licAuthors: ['aa-01', 'aa-02'], component: 'comp-001', licAddText: 'text-aa'},
                    {licAuthors: ['bb-01', 'bb-01'], component: 'comp-002', licAddText: 'text-bb'},
                    {licAuthors: ['cc-01', 'cc-01'], component: 'comp-003', licAddText: 'text-cc'},
                ],
            )
        ],
        rtLicense: new RTLicense(),
        health: new Health(EDeviceHealth.NORMAL_0, 100),
        mam: MasterAssetModel.clone({
            DeviceClass: 'oi4',
            ManufacturerUri: 'test',
            Model: {
                locale: EOPCUALocale.enUS,
                text: 'text'
            },
            Description: {
                locale: EOPCUALocale.enUS,
                text: 'text'
            },
            DeviceManual: '',
            Manufacturer: {
                locale: EOPCUALocale.enUS,
                text: 'text'
            },
            HardwareRevision: '1.0',
            ProductCode: '213dq',
            DeviceRevision: '1.0',
            SerialNumber: '23kl41oßmß132',
            SoftwareRevision: '1.0',
            RevisionCounter: 1,
            ProductInstanceUri: 'wo/'
        } as MasterAssetModel),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        dataLookup: {
            'tag-01': {
                MessageId: '1',
                MessageType: EOPCUAMessageType.uaData,
                PublisherId: '',
                DataSetClassId: '',
                Messages: []
            },
            'tag-02': {
                MessageId: '2',
                MessageType: EOPCUAMessageType.uaData,
                PublisherId: '',
                DataSetClassId: '',
                Messages: []
            }
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        metaDataLookup: {
            'tag-01': {
                MessageId: 'meta-01',
                MessageType: EOPCUAMessageType.uaMetadata,
                PublisherId: '',
                DataSetWriterId: 0,
                filter: '',
                subResource: '',
                correlationId: '',
                MetaData: undefined

            },
            'tag-02': {
                MessageId: 'meta-02',
                MessageType: EOPCUAMessageType.uaMetadata,
                PublisherId: '',
                DataSetWriterId: 0,
                filter: '',
                subResource: '',
                correlationId: '',
                MetaData: undefined
            }
        },
        subscriptionList: [
            {topicPath: 'path-01', config: ESubscriptionListConfig.CONF_1},
            {topicPath: 'path-02', config: ESubscriptionListConfig.NONE_0},
            {topicPath: 'path-03', config: ESubscriptionListConfig.NONE_0}
        ],
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        on: jest.fn(),
        getLicense(oi4Id: string, licenseId?: string): License[] {
            console.log(`Returning licenses ${oi4Id} - ${licenseId}`);
            return this.license;
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        getPublicationList(oi4Id: string, resourceType?: Resource, tag?: string): PublicationList[] {
            return this.publicationList;
        }
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
        const onResourceMock = jest.fn((_, cb) => {
            cb(Resource.HEALTH);
            expect(mockSendResource).toHaveBeenCalledWith(expect.stringContaining('health'), '', '', resources.oi4Id);
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
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        await oi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/metadata/${tagName}`),
            expect.stringContaining(JSON.stringify(resources.metaDataLookup[tagName])));
    });

    it('should send all metadata if tagname not specified', async () => {

        const tagName = ''
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getResourceInfo();
        const oi4Application = new OI4Application(container, mqttOpts);
        await oi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/metadata`),
            expect.stringContaining(JSON.stringify(getResourceInfo().metaDataLookup)));
    });

    it('should send specific data lookup by tagname', async () => {

        const tagName = 'tag-01'
        const oi4Application = getOi4App()
        await oi4Application.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/data/${tagName}`),
            expect.stringContaining(JSON.stringify(oi4Application.applicationResources.dataLookup[tagName])));
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
        await oi4Application.sendResource('health', '', '', filter);
        const expectedAddress = `oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`;
        expect(publish.mock.calls[2][0]).toBe(expectedAddress);
        expect(publish.mock.calls[2][1]).not.toBeUndefined();
        expect(publish.mock.calls[2][1]).not.toBeNull();
    });

    it('should not send resource with invalid zero filter', async () => {

        const filter = '0'
        const oi4Application = getOi4App()
        await oi4Application.sendResource('health', '', '', filter);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    it('should not send resource if page is out of range', async () => {

        const filter = '1'
        const oi4Application = getOi4App()
        await oi4Application.sendResource('health', '', '', filter, 20, 20);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/health/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    async function getPayload(filter: string, resource: string, subResource?: string) {
        const oi4Application = getOi4App()
        return await oi4Application.preparePayload(resource, subResource, filter);
    }

    it('should prepare mam payload', async () => {
        const result = await getPayload('', Resource.MAM);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().mam));
    });

    function checkProfilePayload(payload: any) {
        const profilePayload: Profile = payload.Payload;
        expect(profilePayload.resourceType()).toBe(Resource.PROFILE);
        expect(profilePayload.resource).not.toBeUndefined();
        expect(profilePayload.resource.length).toBeGreaterThan(0);
    }

    it('should prepare profile payload when filter !== oi4Id', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.profile.toString(), Resource.PROFILE);
        checkProfilePayload(result.payload[0]);
    });

    it('should prepare profile payload when filter === oi4Id', async () => {
        const result = await getPayload('1', 'profile');
        checkProfilePayload(result.payload[0]);
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
            .toBe(JSON.stringify(getResourceInfo().licenseText.get(filter)));
    });

    it('should prepare license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.license.toString(), 'license');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify({components: getResourceInfo().license[i].components}));
        }
    });

    it('should prepare publicationList  payload', async () => {
        const result = await getPayload(Resource.PUBLICATION_LIST, 'publicationList');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify(getResourceInfo().publicationList[i]));
        }
    });

    it('should prepare subscriptionList  payload', async () => {
        const result = await getPayload(Resource.SUBSCRIPTION_LIST, 'subscriptionList');
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify(getResourceInfo().subscriptionList[i]));
        }
    });

    it('should  prepare config payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.config.toString(), 'config', 'config');
        expect(JSON.stringify(result.payload[0].Payload))
            .toBe(JSON.stringify(getResourceInfo().config));
    });

    it('should not prepare anything if resource not found', async () => {
        const filter = CDataSetWriterIdLookup.config.toString();
        const resource = 'invalid resource';
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        const result = await oi4Application.preparePayload(resource, '', filter);
        expect(result).toBeUndefined();
    });

    it('should not send resource if error occured in pagination', async () => {

        const mockOPCUABuilder = jest.spyOn(OPCUABuilder.prototype, 'buildPaginatedOPCUANetworkMessageArray').mockReturnValue(undefined);
        const filter = '1'
        const oi4Application = getOi4App()
        jest.clearAllMocks();
        await oi4Application.sendResource('health', '', '', filter, 1, 20);
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
    it('should send status', async () => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        const status: StatusEvent = new StatusEvent(resources.oi4Id, EOPCUAStatusCode.Good, 'fake');
        await oi4Application.sendEventStatus(status);
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/event/status/${encodeURI(`${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}`)}`),
            expect.stringContaining(JSON.stringify(status)));
    });


    it('should replace old config with new config and emit status status via mqttprocess', async () => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        resources.oi4Id = '1/1/1/pub';
        const status: IOPCUANetworkMessage = {
            DataSetClassId: DataSetClassIds['config'],
            PublisherId: `Registry/${resources.oi4Id}`,
            Messages: [
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                {
                    Payload:
                        {
                            category: EventCategory.CAT_STATUS_1,
                            number: 1,
                            description: 'fake',
                            origin: resources.oi4Id
                        },
                    DataSetWriterId: CDataSetWriterIdLookup['event']
                }],
        };

        const mock = jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const sendResourceMock = jest.spyOn(oi4Application.mqttMessageProcess, 'sendResource').mockImplementation();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const eventemitMock = jest.spyOn(EventEmitter.prototype, 'emit');
        const buf = Buffer.from(JSON.stringify(status));
        await oi4Application.mqttMessageProcess.processMqttMessage('oi4/Registry/1/1/1/pub/set/config/group-a', buf, oi4Application.builder);
        expect(sendResourceMock).toBeCalledTimes(1);
        expect(eventemitMock).toHaveBeenCalledWith('setConfig', new StatusEvent(resources.oi4Id, EOPCUAStatusCode.Good));
        expect(oi4Application.applicationResources).toBe(resources);
        mock.mockRestore();
        eventemitMock.mockClear();
        sendResourceMock.mockRestore();
    });

    it('should add new config and send emit status status via mqttprocess', async () => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);


        resources.oi4Id = '1/1/1/pub'

        const status: IOPCUANetworkMessage = {
            DataSetClassId: DataSetClassIds['config'],
            PublisherId: `Registry/${resources.oi4Id}`,
            Messages: [
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                {
                    Payload:
                        {
                            category: EventCategory.CAT_STATUS_1,
                            number: 1,
                            description: 'fake',
                            origin: resources.oi4Id
                        },
                    DataSetWriterId: CDataSetWriterIdLookup['event']
                }],
        };
        resources.config['group-a'] = {
            name: {locale: EOPCUALocale.enUS, text: 'text'},
            'config_a': {
                category: EventCategory.CAT_STATUS_1,
                number: 1,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                description: 'fake',
                origin: resources.oi4Id
            }
        };
        jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const sendResourceMock = jest.spyOn(oi4Application.mqttMessageProcess, 'sendResource').mockImplementation();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const eventemitMock = jest.spyOn(EventEmitter.prototype, 'emit');
        const buf = Buffer.from(JSON.stringify(status));
        await oi4Application.mqttMessageProcess.processMqttMessage('oi4/Registry/1/1/1/pub/set/config/group-a', buf, oi4Application.builder);
        expect(sendResourceMock).toBeCalledTimes(1);
        expect(eventemitMock).toHaveBeenCalledWith('setConfig', new StatusEvent(resources.oi4Id, EOPCUAStatusCode.Good));
        expect(oi4Application.applicationResources).toBe(resources);
        sendResourceMock.mockRestore();
        eventemitMock.mockClear();
    });

    it('should send config with get request', async () => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const oi4Application = new OI4Application(resources, mqttOpts);
        await oi4Application.getConfig();
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/get/config/${getResourceInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify(resources.config)));
    });

});
