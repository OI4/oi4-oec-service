// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {OI4ApplicationResources, IMqttSettingsPaths, OI4ApplicationFactory} from '../../src';
import {Logger} from '@oi4/oi4-oec-service-logger';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import os = require('os');

describe('Test OI4MessageBusFactory', () => {
    let mockConnection: any = jest.fn();
    beforeAll(() => {

        jest.useFakeTimers();
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

    it('test mqtt connection with only certificate auth and encrypted private key', () => {
        const settingsPaths: IMqttSettingsPaths = {
            brokerConfig: `${__dirname}/../__fixtures__/mqtt/broker.json`,
            caCertificate: `${__dirname}/../__fixtures__/certs/ca-root-cert.crt`,
            clientCertificate: '',
            credentials: `${__dirname}/../__fixtures__/secrets/correct_credentials.txt`,
            passphrase: '',
            privateKey: ''
        };

        const resources: OI4ApplicationResources = new OI4ApplicationResources(`${__dirname}/../__fixtures__/mam.json`);
        const factory: OI4ApplicationFactory = new OI4ApplicationFactory(resources, settingsPaths);
        const oi4Application = factory.createOI4Application();
        expect(oi4Application).toBeDefined();
        expect(oi4Application.mqttClient).toBeDefined();
        expect(oi4Application.mqttClient.connected).toBeTruthy();
        const options = oi4Application.mqttClient.options;
        expect(options).toBeDefined();
        expect(options.clientId).toBe(os.hostname());
    });
});
