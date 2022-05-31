import mqtt = require('async-mqtt');
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MqttSettings} from '../src/Proxy/Messagebus/MqttSettings';
import {readFileSync} from 'fs';

const getStandardMqttConfig = (): MqttSettings => {
    return {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };
}

describe('Connection to MQTT with TLS',  () => {
    it('test mqtt connection with only certificate auth and encrypted private key', async () => {

        jest.spyOn(mqtt, 'connectAsync')
            .mockImplementation()
            .mockReturnValue(Promise.resolve({connected: true}) as Promise<mqtt.AsyncMqttClient>);

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        mqttOpts.rejectUnauthorized = true;

         mqttOpts.ca = readFileSync(`${__dirname}/fixtures/ca-root-cert.crt`);
         mqttOpts.cert = readFileSync(`${__dirname}/fixtures/encrypted-client-cert.crt`);
         mqttOpts.key = readFileSync(`${__dirname}/fixtures/encrypted-client-key.key`);
         mqttOpts.passphrase = readFileSync(`${__dirname}/fixtures/passphrase.txt`).toString().trimEnd();
         await mqtt.connectAsync(mqttOpts).then(res => {
             expect(res.connected).toBeTruthy()
         });


    });
    it('test mqtt connection with only certificate auth and decrypted private key', async () => {

        jest.spyOn(mqtt, 'connectAsync')
            .mockImplementation()
            .mockReturnValue(Promise.resolve({connected: true}) as Promise<mqtt.AsyncMqttClient>);

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        mqttOpts.rejectUnauthorized = true;
        mqttOpts.ca = readFileSync(`${__dirname}/fixtures/ca-root-cert.crt`);
        mqttOpts.cert = readFileSync(`${__dirname}/fixtures/decrypted-client-cert.crt`);
        mqttOpts.key = readFileSync(`${__dirname}/fixtures/decrypted-client-key.key`);
        await mqtt.connectAsync(mqttOpts).then(res => expect(res.connected).toBeTruthy());
    });
    it('test mqtt connection with username and password', async () => {

        jest.spyOn(mqtt, 'connectAsync')
            .mockImplementation()
            .mockReturnValue(Promise.resolve({connected: true}) as Promise<mqtt.AsyncMqttClient>);

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        mqttOpts.rejectUnauthorized = false;
        mqttOpts.username = 'test-user';
        mqttOpts.password = '1234';
        await mqtt.connectAsync(mqttOpts).then(res => expect(res.connected).toBeTruthy());
    });
});
