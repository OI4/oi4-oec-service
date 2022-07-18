import {IClientOptions} from 'async-mqtt';

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
