import {
    OI4ApplicationFactory,
    DefaultMqttSettingsPaths,
    IMqttSettingsPaths
} from '@oi4/oi4-oec-service-node';
import {ServiceDemoOI4ApplicationResources} from "./ServiceDemoOI4ApplicationResources";

export { WeatherService } from './weather/WeatherService';
export * from './weather/WeatherServiceModel';

const LocalTestPaths: IMqttSettingsPaths = {
    brokerConfig: '../docker_configs/mqtt/broker.json',
    caCertificate: '../docker_configs/certs/ca.pem',
    // privateKey: '../docker_configs/secrets/mqtt_private_key.pem',
    privateKey: undefined,
    // clientCertificate: `../docker_configs/certs/oi4-oec-service-demo.pem`,
    clientCertificate: undefined,
    // passphrase: '../docker_configs/secrets/mqtt_passphrase',
    passphrase: undefined,
    credentials: '../docker_configs/secrets/mqtt_credentials'
}

export const IS_LOCAL = process.argv.length > 2 && process.argv[2] === 'local';

const applicationResources = new ServiceDemoOI4ApplicationResources(IS_LOCAL);
const paths = IS_LOCAL ? LocalTestPaths : DefaultMqttSettingsPaths;
const applicationFactory = new OI4ApplicationFactory(applicationResources, paths);
applicationFactory.createOI4Application();
console.log('|===========FINISHED============|');
