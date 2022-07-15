import os from "os";

export interface ISettingsPaths {
    mqttSettings: IMqttSettingsPaths;
    certificateStorage: string;
    secretStorage: string;
    applicationSpecificStorages: IApplicationSpecificStorages;
}

export interface IApplicationSpecificStorages {
    configuration: string;
    data: string;
}

export interface IMqttSettingsPaths {
    brokerConfig: string;
    caCertificate: string;
    privateKey: string;
    clientCertificate: string;
    passphrase: string;
    credentials: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DefaultMqttSettingsPaths: IMqttSettingsPaths = {
    brokerConfig: '/etc/oi4/mqtt/broker.json',
    caCertificate: '/etc/oi4/certs/ca.pem',
    privateKey: '/run/secrets/mqtt_private_key.pem',
    clientCertificate: `/etc/oi4/certs/${os.hostname()}.pem`,
    passphrase: '/run/secrets/mqtt_passphrase',
    credentials: '/run/secrets/mqtt_credentials'
}

export const DefaultSettingsPaths: ISettingsPaths = {
    mqttSettings: DefaultMqttSettingsPaths,
    certificateStorage: '/etc/oi4/certs',
    secretStorage: '/run/secrets',
    applicationSpecificStorages: {
        configuration: '/etc/oi4/app',
        data: '/opt/oi4/app'
    }
}

