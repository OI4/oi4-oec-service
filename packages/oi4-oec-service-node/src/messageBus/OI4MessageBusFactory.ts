import {
    BrokerConfiguration,
    MqttSettings,
    Credentials,
    DefaultMqttSettingsPaths, IMqttSettingsPaths
} from './MqttSettings';
import os from 'os';
import {ESyslogEventFilter, IContainerState} from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {OI4MessageBus} from './OI4MessageBus';
import {indexOf} from 'lodash';
import {Logger} from '@oi4/oi4-oec-service-logger';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MQTTS = 'mqtts';

export interface IOI4MessageBusFactory {
    newOI4MessageBus: () => OI4MessageBus;
}

export class OI4MessageBusFactory implements IOI4MessageBusFactory {

    private readonly container: IContainerState;
    private readonly settingsPaths: IMqttSettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;
    private readonly logger: Logger;

    constructor(container: IContainerState, settingsPaths: IMqttSettingsPaths = DefaultMqttSettingsPaths) {
        this.container = container;
        this.settingsPaths = settingsPaths;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        this.logger = new Logger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
    }

    newOI4MessageBus() {
        // TODO handle missing files
        const brokerConfiguration: BrokerConfiguration = JSON.parse(readFileSync(this.settingsPaths.brokerConfig, 'utf8'));
        const mqttSettings: MqttSettings = {
            clientId: os.hostname(),
            host: brokerConfiguration.address,
            port: brokerConfiguration.secure_port,
            protocol: MQTTS,
            properties: {
                maximumPacketSize: OI4MessageBusFactory.getMaxPacketSize(brokerConfiguration)
            }
        }
        // TODO handle missing files
        mqttSettings.ca = readFileSync(this.settingsPaths.caCertificate);
        this.initCredentials(mqttSettings);
        return new OI4MessageBus(this.container, mqttSettings);
    }

    private initCredentials(mqttSettings: MqttSettings) {
        if (this.hasRequiredCertCredentials()) {
            this.logger.log('Client certificates will be used to connect to the broker', ESyslogEventFilter.debug);
            mqttSettings.cert = readFileSync(this.settingsPaths.clientCertificate);
            mqttSettings.key = readFileSync(this.settingsPaths.privateKey);
            mqttSettings.passphrase = this.mqttSettingsHelper.loadPassphrase();
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

    /**
     * Return the maximum packet size for sending
     * @param brokerConfiguration
     * @private
     */
    private static getMaxPacketSize(brokerConfiguration: BrokerConfiguration): number {
            const maxPacketSize = brokerConfiguration.max_packet_size | 256;
            return maxPacketSize >= 256 ? maxPacketSize : 256;
    }

}

export class MqttCredentialsHelper {

    private readonly settingsPaths: IMqttSettingsPaths;

    constructor(settingsPaths: IMqttSettingsPaths) {
        this.settingsPaths = settingsPaths;
    }

    private static decodeFromBase64(string: string) {
        const buff = Buffer.from(string, 'base64');
        return buff.toString('utf-8');
    }


    private static loadAndDecodeSecret(secretFile: string): string {
        const encodedSecret: string = readFileSync(secretFile,'utf8');
        if(encodedSecret === '') {
            throw new Error('Empty secret');
        }
        const cleanedSecret = encodedSecret.trim().replace(/(\r\n|\n|\r)/gm, '')
        return this.decodeFromBase64(cleanedSecret);
    }

    private static validateAndParseCredentials(decodedCredentials: string): Credentials {
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

    private static isUsernameValid(candidateUsername: string) {
        // The username will match the regexp in case it contains and invalid char,
        // therefore if the username match the regexp is invalid.
        const regex = /[^a-zA-Z0-9-._~@]+/;
        return !regex.test(candidateUsername);
    }

    loadPassphrase(): string | undefined {
        const passphrase = this.settingsPaths.passphrase;
        if (!existsSync(passphrase)) {
            return undefined;
        }
        return MqttCredentialsHelper.loadAndDecodeSecret(passphrase);
    }

    loadUserCredentials(): Credentials {
        const credentials = this.settingsPaths.credentials;
        if (!existsSync(credentials)) {
            throw new Error('Credentials file not found');
        }

        const cleanedEncodedCredentials: string = MqttCredentialsHelper.loadAndDecodeSecret(credentials);

        //If the credentials are invalid, then an error is thrown
        return MqttCredentialsHelper.validateAndParseCredentials(cleanedEncodedCredentials);
    };

}



