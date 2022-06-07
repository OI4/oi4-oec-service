import {MQTT_PATH_SETTINGS, MqttSettings} from '../src/Proxy/Messagebus/MqttSettings';
import fs from 'fs';
import {OI4MessageBusProxy} from '../src/Proxy/Messagebus/index';
import {IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';
import {Logger} from '@oi4/oi4-oec-service-logger';
import mqtt  from 'async-mqtt';
import {MqttSettingsHelper} from '../src/Utilities/Helpers/MqttSettingsHelper';

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
        oi4Id: '1',
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
        on(event: string, listener: Function) {
            return this;
        }
    } as IContainerState
}

describe('Connection to MQTT with TLS', () => {
    let mockConnection: any = jest.fn();
    beforeAll(() => {

        jest.useFakeTimers();
        jest.mock('fs');
        mockConnection = jest.spyOn(mqtt, 'connect')
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            .mockImplementation((res) => {
                return {
                    ...{options: res}, ...{
                        connected: true,
                        publish: jest.fn(),
                        on: jest.fn(),
                        subscribe: jest.fn()
                    }
                }
            });

        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        console.log = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
    });
    afterAll(()=>{
        mockConnection.mockReset();
        jest.clearAllTimers();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('test mqtt connection with only certificate auth and encrypted private key',  () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        jest.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('cert')
            .mockReturnValueOnce('ca')
            .mockReturnValueOnce('private key')
            .mockReturnValueOnce('passphrase');
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname());
    });

    it('test mqtt connection with only certificate auth and decrypted private key',  () => {
        jest.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
            return MQTT_PATH_SETTINGS.PASSPHRASE !== path;
        });

        jest.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('cert')
            .mockReturnValueOnce('ca')
            .mockReturnValueOnce('private key');

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBusProxy = new OI4MessageBusProxy(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(oi4messagebus.mqttClient.options.clientId).toEqual(os.hostname())
    });

    it('test mqtt connection with username and password',  () => {
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