import {
    BrokerConfiguration,
    MqttSettings,
    Credentials,
    DefaultMqttSettingsPaths, IMqttSettingsPaths
} from "./MqttSettings";
import os from "os";
import {ESyslogEventFilter, IContainerState} from "@oi4/oi4-oec-service-model";
import {existsSync, readFileSync} from "fs";
import {OI4MessageBus} from "./index";
import {indexOf} from "lodash";
import {Logger} from "@oi4/oi4-oec-service-logger";

const MQTTS = 'mqtts';

export interface IOI4MessageBusFactory {
    newOI4MessageBus: () => OI4MessageBus
}

export class OI4MessageBusFactory implements IOI4MessageBusFactory {

    private readonly container: IContainerState;
    private readonly settingsPaths: IMqttSettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;
    private readonly logger: Logger;

    constructor(container: IContainerState, settingsPaths: IMqttSettingsPaths = DefaultMqttSettingsPaths) {
        this.container = container;
        this.settingsPaths = settingsPaths;
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        this.logger = new Logger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
    }

    newOI4MessageBus() {
        const brokerConfiguration: BrokerConfiguration = JSON.parse(readFileSync(this.settingsPaths.clientCertificate, 'utf8'));
        const mqttSettings: MqttSettings = {
            clientId: os.hostname(),
            host: brokerConfiguration.address,
            port: brokerConfiguration.secure_port,
            protocol: MQTTS,
        }
        mqttSettings.ca = readFileSync(this.settingsPaths.caCertificate);
        this.initCredentials(mqttSettings);
        return new OI4MessageBus(this.container, mqttSettings);
    }

    private initCredentials(mqttSettings: MqttSettings) {
        if (this.hasRequiredCertCredentials()) {
            this.logger.log('Client certificates will be used to connect to the broker', ESyslogEventFilter.debug);
            mqttSettings.cert = readFileSync(this.settingsPaths.clientCertificate);
            mqttSettings.key = readFileSync(this.settingsPaths.privateKey);
            mqttSettings.passphrase = existsSync(this.settingsPaths.passphrase) ? readFileSync(this.settingsPaths.passphrase) : undefined;
        } else {
            this.logger.log('Username and password will be used to connect to the broker', ESyslogEventFilter.debug);
            const userCredentials: Credentials = this.mqttSettingsHelper.loadUserCredentials();
            mqttSettings.username = userCredentials.username;
            mqttSettings.password = userCredentials.password;
            mqttSettings.rejectUnauthorized = false;
        }
    }

    private hasRequiredCertCredentials(): boolean {
        return existsSync(this.settingsPaths.clientCertificate) &&
            existsSync(this.settingsPaths.privateKey)
    }

}

export class MqttCredentialsHelper {

    private readonly credentialsFile: string;

    constructor(settingsPaths: IMqttSettingsPaths) {
        this.credentialsFile = settingsPaths.credentials;
    }

    private static decodeFromBase64(string: string) {
        const buff = Buffer.from(string, 'base64');
        return buff.toString('utf-8');
    }

    private static isUsernameValid(candidateUsername: string) {
        // The username will match the regexp in case it contains and invalid char,
        // therefore if the username match the regexp is invalid.
        const regex = /[^a-zA-Z0-9-._~@]+/;
        return !regex.test(candidateUsername);
    }

    private static validateAndDecodeCredentials(encodedCredentials: string): Credentials {
        if(encodedCredentials === '') {
            throw new Error('Credentials not found : empty file');
        }

        const decodedCredentials = this.decodeFromBase64(encodedCredentials);
        const usernamePasswordSeparatorPosition = indexOf(decodedCredentials, ':');
        if( decodedCredentials.startsWith(':') ||
            usernamePasswordSeparatorPosition == -1) {
            throw new Error('Credentials are does not respect the format "username:password"');
        }

        const username = decodedCredentials.substring(0, usernamePasswordSeparatorPosition);
        if(!this.isUsernameValid(username)) {
            throw new Error('Invalid username');
        }

        const password = decodedCredentials.substring(usernamePasswordSeparatorPosition+1, decodedCredentials.length);

        return {username: username, password: password}
    }

    private static cleanCredentials(encodedCredentials: string): string {
        return encodedCredentials.trim().replace(/(\r\n|\n|\r)/gm, '');
    }

    loadUserCredentials(): Credentials {
        if (!existsSync(this.credentialsFile)) {
            throw new Error('Credentials file not found');
        }

        const encodedCredentials: string = readFileSync(this.credentialsFile,'utf8');
        const cleanedEncodedCredentials: string = MqttCredentialsHelper.cleanCredentials(encodedCredentials);

        //If the credentials are invalid, then an error is thrown
        return MqttCredentialsHelper.validateAndDecodeCredentials(cleanedEncodedCredentials);
    };

}



