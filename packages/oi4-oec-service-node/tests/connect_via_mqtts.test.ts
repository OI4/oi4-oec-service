import mqtt = require('async-mqtt');
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MQTT_PATH_SETTINGS, MqttSettings} from '../src/Proxy/Messagebus/MqttSettings';
import fs from 'fs';
import {OI4MessageBusProxy} from '../dist';
import {IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';

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
            .mockImplementation()
            .mockReturnValue({connected: true, publish: jest.fn(), on: jest.fn()} as unknown as mqtt.AsyncMqttClient);
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockImplementation((path: string) => path);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
    });

    it('test mqtt connection with only certificate auth and decrypted private key', async () => {

        jest.spyOn(mqtt, 'connect')
            .mockImplementation()
            .mockReturnValue({connected: true, publish: jest.fn(), on: jest.fn()} as unknown as mqtt.AsyncMqttClient);
        jest.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
            return MQTT_PATH_SETTINGS.PASSPHRASE !== path;
        });
        jest.spyOn(fs, 'readFileSync').mockImplementation((path: string) => path);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
    });
    it('test mqtt connection with username and password', async () => {

        jest.spyOn(mqtt, 'connect')
            .mockImplementation()
            .mockReturnValue({connected: true, options: {clientId: os.hostname()}, publish: jest.fn(), on: jest.fn()} as unknown as mqtt.AsyncMqttClient);
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        mqttOpts.username = 'test-user';
        mqttOpts.password = '1234';
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname())
    });

});
