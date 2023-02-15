// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {OI4ApplicationResources, IMqttSettingsPaths, OI4ApplicationFactory} from '../../src';
import {Logger} from '@oi4/oi4-oec-service-logger';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import os = require('os');
import {ISettingsPaths, OI4Application} from '../../src';

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
        const settingsPaths: ISettingsPaths = {
            mqttSettings: {
                brokerConfig: `${__dirname}/../__fixtures__/mqtt/broker.json`,
                caCertificate: `${__dirname}/../__fixtures__/certs/ca-root-cert.crt`,
                clientCertificate: '',
                credentials: `${__dirname}/../__fixtures__/secrets/correct_credentials.txt`,
                passphrase: '',
                privateKey: ''
            },
            applicationSpecificStorages: undefined,
            certificateStorage: '',
            secretStorage: '',
        };

        const resources: OI4ApplicationResources = new OI4ApplicationResources(`${__dirname}/../__fixtures__/mam.json`);
        const factory: OI4ApplicationFactory = new OI4ApplicationFactory(resources, settingsPaths);
        const oi4Application = factory.createOI4Application() as OI4Application;
        expect(oi4Application).toBeDefined();
        expect(oi4Application.messageBus.client).toBeDefined();
        expect(oi4Application.messageBus.client.connected).toBeTruthy();
        const options = oi4Application.messageBus.client.options;
        expect(options).toBeDefined();
        expect(options.clientId).toBe(os.hostname());
    });
});
