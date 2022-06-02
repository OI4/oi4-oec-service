import {IClientOptions} from 'async-mqtt';
import os from 'os';

export interface MqttSettings extends IClientOptions{
    host?: string;
    port?: number;
    passphrase?: string | Buffer;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MQTT_PATH_SETTINGS = {
    CA_CERT: '/etc/oi4/certs/ca.pem',
    PRIVATE_KEY: '/run/secrets/mqtt_private_key.pem',
    CLIENT_CERT: `/etc/oi4/certs/${os.hostname()}.pem`,
    PASSPHRASE: '/run/secrets/mqtt_passphrase',
}
