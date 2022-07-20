import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4Application, OI4ApplicationResources} from '../../src';
import {
    Application,
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    PublicationListConfig,
    SubscriptionListConfig,
    EventCategory,
    Health,
    IOI4ApplicationResources,
    License,
    LicenseText,
    MasterAssetModel,
    NamurNE107Event,
    Profile,
    PublicationList,
    Resource,
    RTLicense,
    StatusEvent,
    SubscriptionList,
} from '@oi4/oi4-oec-service-model';
import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    EOPCUAStatusCode,
    IOPCUANetworkMessage,
    OPCUABuilder
} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {AsyncClientEvents} from '../../src/Utilities/Helpers/Enums';
import EventEmitter from 'events';
import {TopicMethods} from '../../dist/Utilities/Helpers/Enums';

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
    // TODO refactor, this is not solved in a good way. Implement a class with OI4ApplicationResources as parent and overwrite what is needed.
    // And harmonize it with the other mocks
    return {
        oi4Id: defaultAppId,
        subResources: new Map<string, IOI4ApplicationResources>(),
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
                resource: 'health',
                config: PublicationListConfig.INTERVAL_2,
                DataSetWriterId: 1,
                oi4Identifier: '1'
            } as PublicationList),
            PublicationList.clone({
                resource: 'mam',
                config: PublicationListConfig.NONE_0,
                DataSetWriterId: 2,
                oi4Identifier: '2'
            } as PublicationList),
            PublicationList.clone({
                resource: 'license',
                config: PublicationListConfig.STATUS_1,
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
            SubscriptionList.clone({topicPath: 'path-01', config: SubscriptionListConfig.CONF_1} as SubscriptionList),
            SubscriptionList.clone({topicPath: 'path-02', config: SubscriptionListConfig.NONE_0} as SubscriptionList),
            SubscriptionList.clone({topicPath: 'path-03', config: SubscriptionListConfig.NONE_0} as SubscriptionList)
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
        },
        getSubscriptionList(oi4Id?: string, resourceType?: Resource, tag?: string): SubscriptionList[] {
            console.log(`subscriptionList elements make no sense and further specification by the OI4 working group ${oi4Id}, ${resourceType}, ${tag}`);
            return this.subscriptionList;
        }
    }
}

let defaultOi4ApplicationResources: OI4ApplicationResources;
let defaultOi4Application: OI4Application;

const defaultTopicPrefix = 'oi4/Registry';
const defaultValidFilter = '1';
const defaultAppId = '1/1/1/1';
const defaultOI4Id = defaultAppId;

export function getOi4App(): OI4Application {
    const mqttOpts: MqttSettings = getStandardMqttConfig();
    const resources = getResourceInfo();
    return OI4Application.builder()
        .withApplicationResources(resources)
        .withMqttSettings(mqttOpts)
        .build()
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
        defaultOi4Application = getOi4App();
        defaultOi4ApplicationResources = defaultOi4Application.applicationResources as OI4ApplicationResources;
    });

    afterAll(() => {
        jest.resetModules();
    });

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
        OI4Application.builder()
            .withApplicationResources(resources)
            .withMqttSettings(mqttOpts)
            .build()
    });

    it('should trigger health from resourceChangedCallback', (done) => {
        const mockSendResource = jest.spyOn(OI4Application.prototype, 'sendResource').mockResolvedValue(undefined);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const onResourceMock = jest.fn((_, cb) => {
            cb(Resource.HEALTH);
            expect(mockSendResource).toHaveBeenCalledWith(expect.stringContaining(Resource.HEALTH), '', '', resources.oi4Id);
            mockSendResource.mockRestore();
            done();
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resources.on = onResourceMock;
        OI4Application.builder()
            .withApplicationResources(resources)
            .withMqttSettings(mqttOpts)
            .build();
    });

    it('should send specific metadata by tagname', async () => {
        const tagName = 'tag-01';
        await defaultOi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.METADATA}/${tagName}`),
            expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.metaDataLookup[tagName])));
    });

    it('should send all metadata if tagname not specified', async () => {
        await defaultOi4Application.sendMetaData('');
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.METADATA}`),
            expect.stringContaining(JSON.stringify(getResourceInfo().metaDataLookup)));
    });

    it('should send specific data lookup by tagname', async () => {
        const tagName = 'tag-01'
        await defaultOi4Application.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.DATA}/${tagName}`),
            expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.dataLookup[tagName])));
    });

    it('should send all data if tagname not specified', async () => {
        const tagName = ''
        await defaultOi4Application.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.DATA}`),
            expect.stringContaining(JSON.stringify(getResourceInfo().dataLookup)));
    });

    it('should send resource with valid filter', async () => {
        await defaultOi4Application.sendResource(Resource.HEALTH, '', '', defaultValidFilter);
        const expectedAddress = `oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.HEALTH}/${defaultValidFilter}`;
        expect(publish.mock.calls[2][0]).toBe(expectedAddress);
        expect(publish.mock.calls[2][1]).not.toBeUndefined();
        expect(publish.mock.calls[2][1]).not.toBeNull();
    });

    it('should not send resource with invalid zero filter', async () => {
        const filter = '0'
        await defaultOi4Application.sendResource(Resource.HEALTH, '', '', filter);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.HEALTH}/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    it('should not send resource if page is out of range', async () => {
        await defaultOi4Application.sendResource(Resource.HEALTH, '', '', defaultValidFilter, 20, 20);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.HEALTH}/${defaultValidFilter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    async function getPayload(filter: string, resource: string, subResource?: string, oi4Application: OI4Application = defaultOi4Application) {
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
        const result = await getPayload(defaultValidFilter, Resource.PROFILE);
        checkProfilePayload(result.payload[0]);
    });

    it('should prepare rt license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.rtLicense.toString(), Resource.RT_LICENSE);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().rtLicense));
    });

    it('should prepare health payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.health.toString(), Resource.HEALTH);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().health));
    });

    it('should prepare license text payload', async () => {
        const filter = 'a';
        const result = await getPayload(filter, Resource.LICENSE_TEXT);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().licenseText.get(filter)));
    });

    it('should prepare license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.license.toString(), Resource.LICENSE);
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify({components: getResourceInfo().license[i].components}));
        }
    });

    it('should prepare publicationList  payload', async () => {
        const result = await getPayload(Resource.PUBLICATION_LIST, Resource.PUBLICATION_LIST);
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify(getResourceInfo().publicationList[i]));
        }
    });

    it('should prepare subscriptionList  payload', async () => {
        const result = await getPayload(Resource.SUBSCRIPTION_LIST, Resource.SUBSCRIPTION_LIST);
        for (let i = 0; i < result.payload.length; i++) {
            const resourceInfo = defaultOi4ApplicationResources.subscriptionList[i];
            expect(JSON.stringify(result.payload[i].Payload)).toBe(JSON.stringify(resourceInfo));
        }
    });

    // TODO refactor this test
    it('should  prepare config payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.config.toString(), Resource.CONFIG, /*Subresource*/Resource.CONFIG);
        expect(result).toBeDefined();
        //expect(JSON.stringify(result.payload[0].Payload))
        //    .toBe(JSON.stringify(getResourceInfo().config));
    });

    it('should not prepare anything if resource not found', async () => {
        const filter = CDataSetWriterIdLookup.config.toString();
        const resource = 'invalid resource';
        const result = await defaultOi4Application.preparePayload(resource, '', filter);
        expect(result).toBeUndefined();
    });

    it('should not send resource if error occured in pagination', async () => {
        const mockOPCUABuilder = jest.spyOn(OPCUABuilder.prototype, 'buildPaginatedOPCUANetworkMessageArray').mockReturnValue(undefined);
        jest.clearAllMocks();
        await defaultOi4Application.sendResource(Resource.HEALTH, '', '', defaultValidFilter, 1, 20);
        expect(publish).toBeCalledTimes(0);
        mockOPCUABuilder.mockRestore();
    });

    it.each(['OI4.OTConnector', 'OTConnector'])('%# should extract service type from mam', async(deviceClass: string) => {
        const res = getResourceInfo();
        res.mam.DeviceClass = deviceClass;

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const app = OI4Application.builder()
            .withApplicationResources(res)
            .withMqttSettings(mqttOpts)
            .build();

        expect(app.serviceType).toBe('OTConnector');
        expect(app.topicPreamble).toBe(`oi4/${app.serviceType}/1/1/1/1`);
    })

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
        jest.clearAllMocks();
        await defaultOi4Application.sendEvent(event, defaultValidFilter);

        const expectedPublishAddress = `oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/pub/event/${event.subResource()}/${defaultValidFilter}`;
        expect(publish).toHaveBeenCalled();
        expect(publish.mock.calls[0][0]).toBe(expectedPublishAddress);
    });

    it('should send status', async () => {
        const status: StatusEvent = new StatusEvent(defaultOi4ApplicationResources.oi4Id, EOPCUAStatusCode.Good, 'fake');
        await defaultOi4Application.sendEventStatus(status);
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resource.EVENT}/status/${encodeURI(`${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}`)}`),
            expect.stringContaining(JSON.stringify(status)));
    });

    function getIOPCUANetworkMessage(appId: string = defaultOi4ApplicationResources.oi4Id): IOPCUANetworkMessage {
        return {
            DataSetClassId: DataSetClassIds['config'],
            PublisherId: `Registry/${appId}`,
            Messages: [
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                {
                    Payload:
                        {
                            category: EventCategory.CAT_STATUS_1,
                            number: 1,
                            description: 'fake',
                            origin: appId
                        },
                    DataSetWriterId: CDataSetWriterIdLookup['event']
                }],
        }
    }

    it('should replace old config with new config and emit status status via mqttprocess', async () => {
        // defaultOi4ApplicationResources.oi4Id = defaultAppId;
        const status: IOPCUANetworkMessage = getIOPCUANetworkMessage();

        const mock = jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const sendResourceMock = jest.spyOn(defaultOi4Application.mqttMessageProcess, 'sendResource').mockImplementation();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const eventEmitMock = jest.spyOn(EventEmitter.prototype, 'emit');

        await defaultOi4Application.mqttMessageProcess.processMqttMessage(`${defaultTopicPrefix}/${defaultAppId}/${TopicMethods.SET}/${Resource.CONFIG}/${defaultOI4Id}/group-a`, Buffer.from(JSON.stringify(status)), defaultOi4Application.builder);

        expect(sendResourceMock).toBeCalledTimes(1);
        expect(eventEmitMock).toHaveBeenCalledWith('setConfig', new StatusEvent(defaultOi4ApplicationResources.oi4Id, EOPCUAStatusCode.Good));
        expect(defaultOi4Application.applicationResources).toBe(defaultOi4ApplicationResources);
        mock.mockRestore();
        eventEmitMock.mockClear();
        sendResourceMock.mockRestore();
    });

    it('should add new config and send emit status status via mqttprocess', async () => {
        // defaultOi4ApplicationResources.oi4Id = defaultOI4Id;
        const status: IOPCUANetworkMessage = getIOPCUANetworkMessage();

        defaultOi4ApplicationResources.config['group-a'] = {
            name: {locale: EOPCUALocale.enUS, text: 'text'},
            'config_a': {
                category: EventCategory.CAT_STATUS_1,
                number: 1,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                description: 'fake',
                origin: defaultOi4ApplicationResources.oi4Id
            }
        };
        jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const sendResourceMock = jest.spyOn(defaultOi4Application.mqttMessageProcess, 'sendResource').mockImplementation();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const eventEmitMock = jest.spyOn(EventEmitter.prototype, 'emit');

        await defaultOi4Application.mqttMessageProcess.processMqttMessage(`${defaultTopicPrefix}/${defaultAppId}/${TopicMethods.SET}/${Resource.CONFIG}/${defaultOI4Id}/group-a`, Buffer.from(JSON.stringify(status)), defaultOi4Application.builder);
        expect(sendResourceMock).toBeCalledTimes(1);
        expect(eventEmitMock).toHaveBeenCalledWith('setConfig', new StatusEvent(defaultOi4ApplicationResources.oi4Id, EOPCUAStatusCode.Good));
        expect(defaultOi4Application.applicationResources).toBe(defaultOi4ApplicationResources);
        sendResourceMock.mockRestore();
        eventEmitMock.mockClear();
    });

    it('should send config with get request', async () => {
        await defaultOi4Application.getConfig();
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getResourceInfo().mam.DeviceClass}/${getResourceInfo().oi4Id}/${TopicMethods.GET}/${Resource.CONFIG}/${getResourceInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.config)));
    });

});
