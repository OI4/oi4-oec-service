import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4Application} from '../src';
import {
    EDeviceHealth,
    EOPCUALocale,
    Health,
    IOI4ApplicationResources,
    IOI4Resource,
    MasterAssetModel,
    Methods,
    Oi4Identifier,
    oi4Namespace,
    Resources,
    ServiceTypes
} from '@oi4/oi4-oec-service-model';
import {Logger} from '@oi4/oi4-oec-service-logger';

const getStandardMqttConfig = (): MqttSettings => {
    return {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };
}

const getOi4ApplicationResources = (): IOI4ApplicationResources => {
    return {
        oi4Id: new Oi4Identifier('test', 'modelText', '213dq', '23kl41oß3mß132'),
        getHealth(): Health {
            return {
                resourceType(): Resources {
                    return Resources.HEALTH;
                },
                Health: EDeviceHealth.NORMAL_0, HealthScore: 0
            };
        },
        mam: MasterAssetModel.clone({
            DeviceClass: 'OI4.Registry',
            ManufacturerUri: 'test',
            Model: {Locale: EOPCUALocale.enUS, Text: 'modelText'},
            Description: {Locale: EOPCUALocale.enUS, Text: 'descriptionText'},
            DeviceManual: '',
            Manufacturer: {Locale: EOPCUALocale.enUS, Text: 'manufacturerText'},
            HardwareRevision: '1.0',
            ProductCode: '213dq',
            DeviceRevision: '1.0',
            SerialNumber: '23kl41oß3mß132',
            SoftwareRevision: '1.0',
            RevisionCounter: 1,
            ProductInstanceUri: 'wo/',
            getServiceType(): ServiceTypes {
                return ServiceTypes.REGISTRY
            }
        } as MasterAssetModel),
        subscriptionList: [],
        sources: new Map<string, IOI4Resource>(),
        on() {
            return this;
        }
    } as unknown as IOI4ApplicationResources;
}

describe('Connection to MQTT with TLS', () => {
    const publish = jest.fn();
    const createMockClient = () => {
        const listeners: Record<string, Function[]> = {};
        return {
            connected: true,
            reconnecting: false,
            publish: publish,
            subscribe: jest.fn(),
            on: jest.fn((event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            }),
            // Helper to trigger events from tests
            emit: async (event: string, ...args: any[]) => {
                if (listeners[event]) {
                    for (const cb of listeners[event]) {
                        await cb(...args);
                    }
                }
            }
        };
    };

    beforeAll(() => {
        jest.useFakeTimers();
        jest.resetAllMocks();
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(MqttCredentialsHelper.prototype, 'loadUserCredentials').mockReturnValue({
            username: 'test-user',
            password: '1234'
        });
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    afterAll(() => {
        jest.clearAllTimers();
        jest.resetModules();
        jest.resetAllMocks();
    });

    it('should send birth message on connect', async () => {
        const mockClient = createMockClient();
        jest.spyOn(mqtt, 'connect').mockImplementation(() => mockClient as any);

        jest.spyOn(global, 'setInterval').mockImplementation((cb: any) => {
            cb();
            return {} as any;
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build() as OI4Application;

        // Trigger connect event manually
        await mockClient.emit('connect');

        expect(oi4Application.messageBus.getClient().connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`${oi4Namespace}/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/${Methods.PUB}/${Resources.MAM}/${getOi4ApplicationResources().oi4Id}`),
            expect.stringContaining(JSON.stringify(getOi4ApplicationResources().mam)),
            undefined);
    });

    it('should send close message on close', async () => {
        const mockClient = createMockClient();
        jest.spyOn(mqtt, 'connect').mockImplementation(() => mockClient as any);

        jest.spyOn(global, 'setInterval').mockImplementation((cb: any) => {
            cb();
            return {} as any;
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build() as OI4Application;

        // Trigger close event manually
        await mockClient.emit('close');

        expect(oi4Application.messageBus.getClient().connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`${oi4Namespace}/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/${Methods.PUB}/${Resources.EVENT}/Status/${encodeURI(`${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}`)}`),
            expect.stringContaining(JSON.stringify({
                Number: 0,
                Category: 'CAT_STATUS_1'
            })),
            undefined);
    });

    it('should set will message on create', () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            (res) => {
                return {...{options: res}, ...{on: jest.fn(), publish: jest.fn()}} as any;
            }
        );

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build() as OI4Application;
        expect(oi4Application.messageBus.getClient().options.will?.payload)
            .toContain(JSON.stringify({Health: EDeviceHealth.FAILURE_1, HealthScore: 0} as Health));
    });

});
