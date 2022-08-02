import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttCredentialsHelper, MqttSettings, OI4Application} from '../src';
import {
    EDeviceHealth,
    Health,
    IOI4ApplicationResources,
    IOI4Resource,
    MasterAssetModel,
    Resource,
} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
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
        oi4Id: new Oi4Identifier('a','b','c','d'),
        getHealth(_: string): Health {
            return {
                resourceType(): Resource {
                    return Resource.HEALTH;
                },
                health: EDeviceHealth.NORMAL_0, healthScore: 0
            };
        },
        mam: MasterAssetModel.clone({
            DeviceClass: 'OI4.Registry',
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
            ProductInstanceUri: 'wo/',
			getServiceType(): ServiceTypes {return ServiceTypes.REGISTRY}
        } as MasterAssetModel),
        subscriptionList: [],
        subResources: new Map<string, IOI4Resource>(),
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
            expect.stringContaining(`oi4/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/pub/mam/${getOi4ApplicationResources().oi4Id}`),
            expect.stringContaining(JSON.stringify({health: EDeviceHealth.NORMAL_0, healthScore: 0})));
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
            expect.stringContaining(`oi4/${getOi4ApplicationResources().mam.getServiceType()}/${getOi4ApplicationResources().oi4Id}/pub/mam/${getOi4ApplicationResources().oi4Id}`),
            expect.stringContaining(JSON.stringify({
                health: EDeviceHealth.NORMAL_0,
                healthScore: 0
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
            .toContain(JSON.stringify({health: EDeviceHealth.FAILURE_1, healthScore: 0} as Health));
    });

});
