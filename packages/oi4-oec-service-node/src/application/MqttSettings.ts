import {IClientOptions} from 'async-mqtt';

export interface MqttSettings extends IClientOptions {
    passphrase?: string | Buffer;
}

export interface BrokerConfiguration {
    Address: string;
    SecurePort: number;
    MaxPacketSize: number;
}

export interface Credentials {
    username: string;
    password: string;
}
