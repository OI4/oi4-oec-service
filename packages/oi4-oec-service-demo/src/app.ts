import {DefaultSettingsPaths, ISettingsPaths, OI4ApplicationFactory,} from '@oi4/oi4-oec-service-node';
import {ServiceDemoOI4ApplicationResources} from './application/ServiceDemoOI4ApplicationResources';
import {ServiceDemoClientCallbacksHelper} from "./application/ServiceDemoClientCallbacksHelper";
import {ServiceDemoMqttMessageProcessor} from "./application/ServiceDemoMqttMessageProcessor";
import {ServiceDemoOI4ApplicationBuilder} from "./application/ServiceDemoOI4ApplicationBuilder";

export {WeatherService} from './weather/WeatherService';
export * from './weather/WeatherServiceModel';

const LocalTestPaths: ISettingsPaths = {
    mqttSettings: {
        brokerConfig: './docker_configs/mqtt/broker.json',
        caCertificate: './docker_configs/certs/ca.pem',
        // privateKey: './docker_configs/secrets/mqtt_private_key.pem',
        privateKey: undefined,
        // clientCertificate: `.../docker_configs/certs/oi4-oec-service-demo.pem`,
        clientCertificate: undefined,
        // passphrase: './docker_configs/secrets/mqtt_passphrase',
        passphrase: undefined,
        credentials: './docker_configs/secrets/mqtt_credentials'
    },
    certificateStorage: './docker_configs/certs/',
    secretStorage: './docker_configs/secrets',
    applicationSpecificStorages: {
        configuration: './docker_configs/app',
        data: './docker_configs/app'
    }
}

export const IS_LOCAL = process.argv.length > 2 && process.argv[2] === 'local';

const paths: ISettingsPaths = IS_LOCAL ? LocalTestPaths : DefaultSettingsPaths;
const applicationResources = new ServiceDemoOI4ApplicationResources(IS_LOCAL, paths);
const builder = new ServiceDemoOI4ApplicationBuilder().withAppid(paths);
const applicationFactory = new OI4ApplicationFactory(applicationResources, paths).initialize(builder);
applicationFactory.builder//
    .withClientCallbacksHelper(new ServiceDemoClientCallbacksHelper())//
    .withMqttMessageProcessor(new ServiceDemoMqttMessageProcessor());

applicationFactory.createOI4Application();

console.log('|=========== FINISHED initiating Service Demo ============|');
