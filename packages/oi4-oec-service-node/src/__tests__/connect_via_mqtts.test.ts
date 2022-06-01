import mqtt = require('async-mqtt');
import {MQTT_PATH_SETTINGS, MqttSettings} from '../Proxy/Messagebus/MqttSettings';
import fs from 'fs';
import {OI4MessageBusProxy} from '../Proxy/Messagebus/index';
import {IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';
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
        }
    } as IContainerState
}

describe('Connection to MQTT with TLS',  () => {
    it('test mqtt connection with only certificate auth and encrypted private key', async () => {
        jest.spyOn(mqtt, 'connect')
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            .mockImplementation((res) => {
                return {...{options: res}, ...{connected: true, publish: jest.fn(), on: jest.fn(), subscribe: jest.fn()}}
            });
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockImplementation((path: string) => path);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname())

    });

    it('test mqtt connection with only certificate auth and decrypted private key', async () => {
        jest.spyOn(mqtt, 'connect')
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            .mockImplementation((res) => {
                return {...{options: res}, ...{connected: true, publish: jest.fn(), on: jest.fn(), subscribe: jest.fn()}}
            });
        jest.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
            return MQTT_PATH_SETTINGS.PASSPHRASE !== path;
        });
        jest.spyOn(fs, 'readFileSync').mockImplementation((path: string) => path);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname())
    });

    it('test mqtt connection with username and password', async () => {


        jest.spyOn(mqtt, 'connect')
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            .mockImplementation((res) => {
                return {...{options: res}, ...{connected: true, publish: jest.fn(), on: jest.fn(), subscribe: jest.fn()}}
            });
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(MqttSettingsHelper.prototype, 'loadUserCredentials').mockReturnValue({username:'test-user', password: '1234'});
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname())
        expect(oi4messagebus.mqttClient.options.username).toEqual('test-user')
        expect(oi4messagebus.mqttClient.options.password).toEqual('1234')
    });

});
