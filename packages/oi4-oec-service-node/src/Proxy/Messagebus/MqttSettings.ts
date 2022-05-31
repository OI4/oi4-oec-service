import {IClientOptions} from 'async-mqtt';

export interface MqttSettings extends IClientOptions{
    host?: string;
    port?: number;
    useUnsecureBroker?: boolean;
    passphrase?: string | Buffer;
}
