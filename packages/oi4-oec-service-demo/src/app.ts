import {
    OI4ApplicationResources,
    OI4ApplicationFactory,
    DefaultMqttSettingsPaths,
    IMqttSettingsPaths
} from '@oi4/oi4-oec-service-node';
import {DEFAULT_MAM_FILE} from '@oi4/oi4-oec-service-node';

const LocalTestPaths: IMqttSettingsPaths = {
    brokerConfig: '../docker_configs/mqtt/broker.json',
    caCertificate: '../docker_configs/certs/ca.pem',
    privateKey: '../docker_configs/secrets/mqtt_private_key.pem',
    clientCertificate: `../docker_configs/certs/oi4-oec-service-demo.pem`,
    passphrase: '../docker_configs/secrets/mqtt_passphrase',
    credentials: '../docker_configs/secrets/mqtt_credentials'
}

let isLocal = process.argv.length > 2 && process.argv[2] === 'local';

const mamFile = isLocal ? '../docker_configs/config/mam.json' : DEFAULT_MAM_FILE;
const paths = isLocal ? LocalTestPaths : DefaultMqttSettingsPaths;
const applicationFactory = new OI4ApplicationFactory(new OI4ApplicationResources(mamFile), paths);

applicationFactory.createOI4Application();
console.log('|===========FINISHED============|');
