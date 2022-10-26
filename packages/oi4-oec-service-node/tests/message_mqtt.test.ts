import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4Application} from '../src';
import {
    EDeviceHealth,
    Health,
    IOI4ApplicationResources,
    IOI4Resource,
    MasterAssetModel, Methods,
    Resources,
} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {OI4_NS} from '@oi4/oi4-oec-service-node';

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
        oi4Id: new Oi4Identifier('test','modelText','213dq','23kl41oß3mß132'),
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
			getServiceType(): ServiceTypes {return ServiceTypes.REGISTRY}
        } as MasterAssetModel),
        subscriptionList: [],
        sources: new Map<string, IOI4Resource>(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        on(event: string, listener: Function) {
            return this;
        }
    } as unknown as IOI4ApplicationResources;
}

describe('Connection to MQTT with TLS', () => {
    const onEvent = () => jest.fn(async (event, cb) => {
        await cb(event);
    });

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const publish = jest.fn((topic, _) => {
        return topic;
    });

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

    it('should send birth message on connect', () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    on: onEvent(),
                }
            }
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function, ms: number) => {
            cb();
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build()
        expect(oi4Application.mqttClient.connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`${OI4_NS}/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/${Methods.PUB}/${Resources.MAM}/${getOi4ApplicationResources().oi4Id}`),
            expect.stringContaining(JSON.stringify({Health: EDeviceHealth.NORMAL_0, HealthScore: 0})));
    });

    it('should send close message on close', async () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    on: onEvent(),
                }
            }
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function, ms: number) => {
            cb();
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build();
        expect(oi4Application.mqttClient.connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`Oi4/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/Pub/MAM/${getOi4ApplicationResources().oi4Id}`),
            expect.stringContaining(JSON.stringify({
                Health: EDeviceHealth.NORMAL_0,
                HealthScore: 0
            } as Health)));
    });

    it('should set will message on create', () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            (res) => {
                return {...{options: res}, ...{on: jest.fn(), publish: jest.fn()}};
            }
        );

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4Application: OI4Application = OI4Application.builder()
            .withApplicationResources(getOi4ApplicationResources())
            .withMqttSettings(mqttOpts)
            .build();
        expect(oi4Application.mqttClient.options.will?.payload)
            .toContain(JSON.stringify({Health: EDeviceHealth.FAILURE_1, HealthScore: 0} as Health));
    });

});
