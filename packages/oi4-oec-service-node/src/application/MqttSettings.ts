import {IClientOptions} from 'async-mqtt';
import os from 'os';

export interface MqttSettings extends IClientOptions{
    passphrase?: string | Buffer;
}

export interface BrokerConfiguration {
    address: string;
    secure_port: number;
    max_packet_size: number;
}

export interface Credentials {
    username: string;
    password: string;
}

export interface IBaseSettingsPaths {
    brokerConfig: string;
    caCertificate: string;
    privateKey: string;
    clientCertificate: string;
    passphrase: string;
    credentials: string;
}

export interface IMqttSettingsPaths extends IBaseSettingsPaths {}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DefaultMqttSettingsPaths: IMqttSettingsPaths = {
    brokerConfig: '/etc/oi4/mqtt/broker.json',
    caCertificate: '/etc/oi4/certs/ca.pem',
    privateKey: '/run/secrets/mqtt_private_key.pem',
    clientCertificate: `/etc/oi4/certs/${os.hostname()}.pem`,
    passphrase: '/run/secrets/mqtt_passphrase',
    credentials: '/run/secrets/mqtt_credentials'
}
