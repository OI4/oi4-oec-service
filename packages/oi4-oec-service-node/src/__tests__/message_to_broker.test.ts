import mqtt = require('async-mqtt');
import {MqttSettings} from '../Proxy/Messagebus/MqttSettings';
import fs from 'fs';
import {HealthState} from '../Proxy/Messagebus/HealthState';
import {OI4MessageBusProxy} from '../Proxy/Messagebus/index';
import {EDeviceHealth, IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {MqttSettingsHelper} from '../Utilities/Helpers/MqttSettingsHelper';
const getStandardMqttConfig = (): MqttSettings => {
    return {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };
}

const getContainerInfo = (): IContainerState => {
    return {
        oi4Id:'1',
        mam: {
            DeviceClass: 'oi4',
            ManufacturerUri: 'test',
            Model: {locale: EOPCUALocale.enUS, text: 'text'},
            Description: { locale: EOPCUALocale.enUS, text: 'text'},
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
        subscriptionList: {
            subscriptionList:[]
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        on(event: string, listener: Function) {
            return this;
        }
    } as IContainerState
}

describe('Connection to MQTT with TLS',  () => {

    beforeAll(() => {
        jest.spyOn(MqttSettingsHelper.prototype, 'loadUserCredentials').mockReturnValue({username:'test-user', password: '1234'});
    });

    it('should send birth message on connect', async () => {

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const publish = jest.fn((topic, _) => {
            return topic;
        });

            jest.spyOn(mqtt, 'connect').mockImplementation(
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    on: jest.fn(async (event, cb) =>
                    {
                        if(event === 'connect') {
                            cb()
                        }

                    }),
                }
            }
        );

        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);


        const mqttOpts: MqttSettings = getStandardMqttConfig();
            const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
            expect(oi4messagebus.mqttClient.connected).toBeTruthy();
            expect(publish).toHaveBeenCalledWith(
                expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/mam/${getContainerInfo().oi4Id}`),
                expect.stringContaining(JSON.stringify(getContainerInfo().mam)));
    });

    it('should send close message on close', async () => {

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const publish = jest.fn((topic, _) => {
            return topic;
        });

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    on: jest.fn(async (event, cb) =>
                    {
                        if(event === 'close') {
                            cb()
                        }

                    }),
                }
            }
        );

        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);


        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/mam/${getContainerInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify({health: EDeviceHealth.NORMAL_0, healthScore: 0 } as HealthState)));
    });


    it('should set will message on create', async () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            (res) => {
                return {...{options: res}, ...{on: jest.fn(), publish: jest.fn()}};
            }
        )

        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);


        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.options.will?.payload)
            .toContain(JSON.stringify({health: EDeviceHealth.FAILURE_1, healthScore: 0} as HealthState));
    });

});