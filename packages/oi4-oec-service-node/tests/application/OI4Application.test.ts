import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4_NS, OI4Application} from '../../src';
import {
    Application,
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    EventCategory,
    getResource,
    Health,
    IOI4ApplicationResources,
    License,
    LicenseText,
    MasterAssetModel,
    Methods,
    NamurNE107Event,
    Profile,
    PublicationList,
    PublicationListConfig,
    Resources,
    RTLicense,
    StatusEvent,
    SubscriptionList,
    SubscriptionListConfig,
} from '@oi4/oi4-oec-service-model';
import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    EOPCUAStatusCode,
    IOPCUANetworkMessage,
    Oi4Identifier,
    OPCUABuilder,
} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {OI4ResourceEvent} from '../../src/application/OI4Resource';

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


const defaultTopicPrefix = `${OI4_NS}/Registry`;
const defaultValidFilter = '1';
const defaultAppId = new Oi4Identifier('1', '1', '1', '1');
const defaultOI4Id = defaultAppId;

const getResourceInfo = (): IOI4ApplicationResources => {
    const licenseText = new Map<string, LicenseText>();
    licenseText.set('a', LicenseText.clone({LicenseText: '1'} as LicenseText));
    licenseText.set('b', LicenseText.clone({LicenseText: '2'} as LicenseText));

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    // TODO refactor, this is not solved in a good way. Implement a class with OI4ApplicationResources as parent and overwrite what is needed.
    // And harmonize it with the other mocks
    return {
        oi4Id: defaultAppId,
        sources: new Map<string, IOI4ApplicationResources>(),
        config: {
            registry: {
                name: {Locale: EOPCUALocale.enUS, Text: 'reg-01'},
                showRegistry: {
                    value: 'val-showreg-01',
                    type: EOPCUABaseDataType.DateTime,
                    name: {Locale: EOPCUALocale.enUS, Text: 'showreg-01'}
                },
                developmentMode: {
                    value: 'val-dev-01',
                    type: EOPCUABaseDataType.Number,
                    name: {Locale: EOPCUALocale.enUS, Text: 'dev-01'}
                }
            },
            logging: {
                auditLevel: {
                    name: {Locale: EOPCUALocale.enUS, Text: 'audit-01'},
                    value: 'val-01',
                    type: EOPCUABaseDataType.Boolean
                },
                name: {Locale: EOPCUALocale.enUS, Text: 'login-01'},
                logType: {
                    value: 'val-type-01',
                    type: EOPCUABaseDataType.String,
                    name: {Locale: EOPCUALocale.enUS, Text: 'type-01'}
                },
                logFileSize: {
                    value: 'val-log-01',
                    type: EOPCUABaseDataType.ByteString,
                    name: {Locale: EOPCUALocale.enUS, Text: 'log-01'}
                }
            },
            context: {name: {Locale: EOPCUALocale.enUS, Text: 'config-01'}, description: undefined}
        },
        // TODO changed from oi4Id to Source...just in case it fails
        publicationList: [
            PublicationList.clone({
                Resource: Resources.HEALTH,
                Config: PublicationListConfig.INTERVAL_2,
                DataSetWriterId: 1,
                Source: new Oi4Identifier('1', '1', '1', '1'),
            } as PublicationList),
            PublicationList.clone({
                Resource: Resources.MAM,
                Config: PublicationListConfig.NONE_0,
                DataSetWriterId: 2,
                Source: new Oi4Identifier('2', '2', '2', '2'),
            } as PublicationList),
            PublicationList.clone({
                Resource: Resources.LICENSE,
                Config: PublicationListConfig.MODE_1,
                DataSetWriterId: 3,
                Source: new Oi4Identifier('3', '3', '3', '3'),
            } as PublicationList)
        ],
        profile: new Profile(Application.mandatory),
        licenseText: licenseText,
        license: [
            new License('1', [
                    {LicAuthors: ['a-01', 'a-02'], Component: 'comp-01', LicAddText: 'text-a'},
                    {LicAuthors: ['b-01', 'b-01'], Component: 'comp-02', LicAddText: 'text-b'},
                    {LicAuthors: ['c-01', 'c-01'], Component: 'comp-03', LicAddText: 'text-c'},
                ]
            ),
            new License('2', [
                    {LicAuthors: ['aa-01', 'aa-02'], Component: 'comp-001', LicAddText: 'text-aa'},
                    {LicAuthors: ['bb-01', 'bb-01'], Component: 'comp-002', LicAddText: 'text-bb'},
                    {LicAuthors: ['cc-01', 'cc-01'], Component: 'comp-003', LicAddText: 'text-cc'},
                ],
            )
        ],
        rtLicense: new RTLicense(),
        health: new Health(EDeviceHealth.NORMAL_0, 100),
        mam: MasterAssetModel.clone({
            DeviceClass: 'OI4.Aggregation',
            ManufacturerUri: 'test',
            Model: {
                Locale: EOPCUALocale.enUS,
                Text: 'text'
            },
            Description: {
                Locale: EOPCUALocale.enUS,
                Text: 'text'
            },
            DeviceManual: '',
            Manufacturer: {
                Locale: EOPCUALocale.enUS,
                Text: 'text'
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
                Filter: '',
                Source: '',
                CorrelationId: '',
                MetaData: undefined

            },
            'tag-02': {
                MessageId: 'meta-02',
                MessageType: EOPCUAMessageType.uaMetadata,
                PublisherId: '',
                DataSetWriterId: 0,
                Filter: '',
                Source: '',
                CorrelationId: '',
                MetaData: undefined
            }
        },
        subscriptionList: [
            SubscriptionList.clone({TopicPath: 'path-01', Config: SubscriptionListConfig.CONF_1} as SubscriptionList),
            SubscriptionList.clone({TopicPath: 'path-02', Config: SubscriptionListConfig.NONE_0} as SubscriptionList),
            SubscriptionList.clone({TopicPath: 'path-03', Config: SubscriptionListConfig.NONE_0} as SubscriptionList)
        ],
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        on: jest.fn(),
        getMasterAssetModel(): MasterAssetModel {
            return this.mam;
        },
        getHealth(): Health {
            return this.health;
        },
        getLicense(): License[] {
            return this.license;
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        getPublicationList(): PublicationList[] {
            return this.publicationList;
        },
        getSubscriptionList(): SubscriptionList[] {
            return this.subscriptionList;
        },
        setConfig(): boolean {
            return true;
        },
        addDataSet(): void {
            return;
        }
    } as IOI4ApplicationResources;
}

let defaultOi4ApplicationResources: IOI4ApplicationResources;
let defaultOi4Application: OI4Application;

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
        defaultOi4ApplicationResources = defaultOi4Application.applicationResources as IOI4ApplicationResources;
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
        const setOfEvents = new Set<string>(Object.values(OI4ResourceEvent)
            // .filter(event => event !== AsyncClientEvents.MESSAGE && event !== OI4ResourceEvent.RESOURCE_CHANGED));
            .filter(event => event !== OI4ResourceEvent.RESOURCE_CHANGED));

        for (const event of events) {
            expect(setOfEvents.has(event)).toBeTruthy();
        }
    });

    it('should trigger resourceChanged', () => {
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        const onResourceMock = jest.fn((event, cb) => {
            cb(resources.oi4Id.toString(), event);
            expect(event).toBe(OI4ResourceEvent.RESOURCE_CHANGED);
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resources.on = onResourceMock;
        OI4Application.builder()
            .withApplicationResources(resources)
            .withMqttSettings(mqttOpts)
            .build()
    });

    it('should trigger health from resourceChangedCallback', () => {
        const mockSendResource = jest.spyOn(OI4Application.prototype, 'sendResource').mockResolvedValue(undefined);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const resources = getResourceInfo();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resources.on = jest.fn((val, cb) => {
            cb(resources.oi4Id, Resources.HEALTH);
            expect(mockSendResource).toHaveBeenCalled();
            expect(mockSendResource).toHaveBeenCalledWith(expect.stringContaining(Resources.HEALTH), '', resources.oi4Id.toString(), '');
        });
        OI4Application.builder()
            .withApplicationResources(resources)
            .withMqttSettings(mqttOpts)
            .build();
    });

    it('should send specific metadata by tagname', async () => {
        const tagName = 'tag-01';
        await defaultOi4Application.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.METADATA}/${tagName}`),
            expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.metaDataLookup[tagName])));
    });

    it('should send all metadata if tagname not specified', async () => {
        await defaultOi4Application.sendMetaData('');
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.METADATA}`),
            expect.stringContaining(JSON.stringify(getResourceInfo().metaDataLookup)));
    });

    // The following function is not defined yet/anymore
    // it('should send specific data lookup by tagname', async () => {
    //     const tagName = 'tag-01'
    //     await defaultOi4Application.sendData(tagName);
    //     expect(publish).toHaveBeenCalledWith(
    //         expect.stringContaining(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resources.DATA}/${tagName}`),
    //         expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.dataLookup[tagName])));
    // });

    // The following function is not defined yet/anymore
    // it('should send all data if tagname not specified', async () => {
    //     const tagName = ''
    //     await defaultOi4Application.sendData(tagName);
    //     expect(publish).toHaveBeenCalledWith(
    //         expect.stringContaining(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${TopicMethods.PUB}/${Resources.DATA}`),
    //         expect.stringContaining(JSON.stringify(getResourceInfo().dataLookup)));
    // });

    it('should send resource with valid filter', async () => {
        await defaultOi4Application.sendResource(Resources.HEALTH, '', '', defaultValidFilter);
        const expectedAddress = `${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/`;
        expect(publish).toHaveBeenCalledWith(expect.stringContaining(expectedAddress), expect.stringContaining(JSON.stringify(getResourceInfo().mam)));
    });

    it('should not send resource with invalid zero filter', async () => {
        const filter = '0'
        await defaultOi4Application.sendResource(Resources.HEALTH, '', '', filter);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.HEALTH}/${filter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    it('should not send resource if page is out of range', async () => {
        await defaultOi4Application.sendResource(Resources.HEALTH, '', '', defaultValidFilter, 20, 20);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.HEALTH}/${defaultValidFilter}`), expect.stringContaining(JSON.stringify(getResourceInfo().health)))
    });

    async function getPayload(filter: string, resource: string, source?: string, oi4Application: OI4Application = defaultOi4Application) {
        return await oi4Application.preparePayload(getResource(resource), source, filter);
    }

    it('should prepare mam payload', async () => {
        const result = await getPayload('', Resources.MAM, defaultAppId.toString());
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().mam));
    });

    function checkProfilePayload(payload: any) {
        const profilePayload: Profile = payload.Payload;
        expect(profilePayload.resourceType()).toBe(Resources.PROFILE);
        expect(profilePayload.Resources).not.toBeUndefined();
        expect(profilePayload.Resources.length).toBeGreaterThan(0);
    }

    it('should prepare profile payload when filter !== oi4Id', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.Profile.toString(), Resources.PROFILE);
        checkProfilePayload(result.payload[0]);
    });

    it('should prepare profile payload when filter === oi4Id', async () => {
        const result = await getPayload(defaultValidFilter, Resources.PROFILE);
        checkProfilePayload(result.payload[0]);
    });

    it('should prepare rt license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.RtLicense.toString(), Resources.RT_LICENSE);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().rtLicense));
    });

    it('should prepare health payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.Health.toString(), Resources.HEALTH, defaultOI4Id.toString());
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().health));
    });

    it('should prepare license text payload', async () => {
        const filter = 'a';
        const result = await getPayload(filter, Resources.LICENSE_TEXT);
        expect(JSON.stringify(result.payload[0].Payload)).toBe(JSON.stringify(getResourceInfo().licenseText.get(filter)));
    });

    it('should prepare license payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.License.toString(), Resources.LICENSE, defaultOI4Id.toString());
        for (let i = 0; i < result.payload.length; i++) {
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify({components: getResourceInfo().license[i].Components}));
        }
    });

    it('should prepare publicationList  payload', async () => {
        const result = await getPayload(Resources.PUBLICATION_LIST, Resources.PUBLICATION_LIST, defaultOI4Id.toString());
        for (let i = 0; i < result.payload.length; i++) {
            // TODO change from oi4 to source...just in case it fails
            expect(JSON.stringify(result.payload[i].Payload))
                .toBe(JSON.stringify({
                    ...getResourceInfo().publicationList[i],
                    Source: getResourceInfo().publicationList[i].Source.toString()
                }));
        }
    });

    it('should prepare subscriptionList  payload', async () => {
        const result = await getPayload(Resources.SUBSCRIPTION_LIST, Resources.SUBSCRIPTION_LIST, defaultOI4Id.toString());
        for (let i = 0; i < result.payload.length; i++) {
            const resourceInfo = defaultOi4ApplicationResources.subscriptionList[i];
            expect(JSON.stringify(result.payload[i].Payload)).toBe(JSON.stringify(resourceInfo));
        }
    });

    // TODO refactor this test
    it('should prepare config payload', async () => {
        const result = await getPayload(CDataSetWriterIdLookup.Config.toString(), Resources.CONFIG, defaultOI4Id.toString());
        expect(result).toBeDefined();
        //expect(JSON.stringify(result.payload[0].Payload))
        //    .toBe(JSON.stringify(getResourceInfo().config));
    });

    // it('should not prepare anything if resource not found', async () => {
    //     const filter = CDataSetWriterIdLookup.config.toString();
    //     const resource = 'invalid resource';
    //     const result = await defaultOi4Application.preparePayload(Resources.MAM, '', filter);
    //     expect(result).toBeUndefined();
    // });

    it('should not send resource if error occured in pagination', async () => {
        const mockOPCUABuilder = jest.spyOn(OPCUABuilder.prototype, 'buildPaginatedOPCUANetworkMessageArray').mockReturnValue(undefined);
        jest.clearAllMocks();
        await defaultOi4Application.sendResource(Resources.HEALTH, '', '', defaultValidFilter, 1, 20);
        expect(publish).toBeCalledTimes(0);
        mockOPCUABuilder.mockRestore();
    });

    function createEvent(): NamurNE107Event {
        const event = new NamurNE107Event(0, 'fakeDescription');
        event.Details = {
            DiagnosticCode: 'fakeCode',
            Location: 'fakeLocation',
        }
        return event;
    }

    it('should send event', async () => {
        const event = createEvent();
        jest.clearAllMocks();
        const oi4IdString = defaultOi4ApplicationResources.oi4Id.toString();
        await defaultOi4Application.sendEvent(event, oi4IdString, defaultValidFilter);

        const expectedPublishAddress = `${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.EVENT}/${oi4IdString}/${defaultValidFilter}`;
        expect(publish).toHaveBeenCalled();
        expect(publish.mock.calls[0][0]).toBe(expectedPublishAddress);
    });

    it('should send status', async () => {
        const oi4IdString = defaultOi4ApplicationResources.oi4Id.toString();
        const status: StatusEvent = new StatusEvent(EOPCUAStatusCode.Good, 'fake');
        await defaultOi4Application.sendEventStatus(status, oi4IdString);
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.PUB}/${Resources.EVENT}/Status/${encodeURI(`${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}`)}`),
            expect.stringContaining(JSON.stringify(status)));
    });

    function getIOPCUANetworkMessage(appId: Oi4Identifier = defaultOi4ApplicationResources.oi4Id): IOPCUANetworkMessage {
        return {
            DataSetClassId: DataSetClassIds[Resources.CONFIG],
            PublisherId: `Registry/${appId}`,
            Messages: [
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                {
                    Payload:
                        {
                            Category: EventCategory.CAT_STATUS_1,
                            Number: 1,
                            Description: 'fake',
                            Origin: appId
                        },
                    DataSetWriterId: CDataSetWriterIdLookup[Resources.EVENT]
                }],
        }
    }

    it('should replace old config with new config and emit status status via mqtt process', async () => {
        const status: IOPCUANetworkMessage = getIOPCUANetworkMessage();

        const mock = jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);
        defaultOi4Application.sendEventStatus = jest.fn();

        await defaultOi4Application.mqttMessageProcess.processMqttMessage(`${defaultTopicPrefix}/${defaultAppId}/${Methods.SET}/${Resources.CONFIG}/${defaultOI4Id}/group-a`, Buffer.from(JSON.stringify(status)), defaultOi4Application.builder, defaultOi4Application);

        expect(defaultOi4Application.sendEventStatus).toHaveBeenCalledWith(new StatusEvent(EOPCUAStatusCode.Good), '1/1/1/1');
        expect(defaultOi4Application.applicationResources).toBe(defaultOi4ApplicationResources);
        mock.mockRestore();
    });

    it('should update config and send emit status status via mqtt process', async () => {
        const setConfig = getIOPCUANetworkMessage();

        defaultOi4ApplicationResources.config['group-a'] = {
            Name: {Locale: EOPCUALocale.enUS, Text: 'text'},
            'config_a': {
                Name: {Locale: EOPCUALocale.enUS, Text: 'config_a'},
                Value: '1000',
                Type: EOPCUABaseDataType.Number
            }
        };
        jest.spyOn(OPCUABuilder.prototype, 'checkTopicPath').mockReturnValue(true);

        defaultOi4Application.sendEventStatus = jest.fn();

        await defaultOi4Application.mqttMessageProcess.processMqttMessage(`${defaultTopicPrefix}/${defaultAppId}/${Methods.SET}/${Resources.CONFIG}/${defaultOI4Id}/group-a`, Buffer.from(JSON.stringify(setConfig)), defaultOi4Application.builder, defaultOi4Application);

        expect(defaultOi4Application.sendEventStatus).toHaveBeenCalledWith(new StatusEvent(EOPCUAStatusCode.Good), '1/1/1/1');
        expect(defaultOi4Application.applicationResources).toBe(defaultOi4ApplicationResources);
    });

    it('should send config with get request', async () => {
        await defaultOi4Application.getConfig();
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`${OI4_NS}/${getResourceInfo().mam.getServiceType()}/${getResourceInfo().oi4Id}/${Methods.GET}/${Resources.CONFIG}/${getResourceInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify(defaultOi4ApplicationResources.config)));
    });

});
