export interface MqttSettings {
    host: string,
    port: number,
    clientId: string,
    useUnsecureBroker?: boolean,
    username?: string,
    password: string,
}
