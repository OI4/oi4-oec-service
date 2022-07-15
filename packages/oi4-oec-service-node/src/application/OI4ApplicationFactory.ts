import {
    BrokerConfiguration,
    MqttSettings,
    Credentials,
    DefaultMqttSettingsPaths, IMqttSettingsPaths, IBaseSettingsPaths
} from './MqttSettings';
import os from 'os';
import {ESyslogEventFilter, IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {OI4Application} from './OI4Application';
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {BaseCredentialsHelper} from '../Utilities/Helpers/BaseCredentialsHelper';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MQTTS = 'mqtts';

export interface IOI4MessageBusFactory {
    createOI4Application: () => OI4Application;
}

export class OI4ApplicationFactory implements IOI4MessageBusFactory {

    private readonly resources: IOI4ApplicationResources;
    private readonly settingsPaths: IMqttSettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;

    constructor(resources: IOI4ApplicationResources, settingsPaths: IMqttSettingsPaths = DefaultMqttSettingsPaths) {
        this.resources = resources;
        this.settingsPaths = settingsPaths;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        initializeLogger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
    }

    createOI4Application(): OI4Application {
        // TODO handle missing files
        const brokerConfiguration: BrokerConfiguration = JSON.parse(readFileSync(this.settingsPaths.brokerConfig, 'utf8'));
        const mqttSettings: MqttSettings = {
            clientId: os.hostname(),
            host: brokerConfiguration.address,
            port: brokerConfiguration.secure_port,
            protocol: MQTTS,
            properties: {
                maximumPacketSize: OI4ApplicationFactory.getMaxPacketSize(brokerConfiguration)
            }
        }
        this.initCredentials(mqttSettings);
        return new OI4Application(this.resources, mqttSettings);
    }

    private initCredentials(mqttSettings: MqttSettings) {
        if (this.hasRequiredCertCredentials()) {
            LOGGER.log('Client certificates will be used to connect to the broker', ESyslogEventFilter.debug);
            mqttSettings.ca = readFileSync(this.settingsPaths.caCertificate);
            mqttSettings.cert = readFileSync(this.settingsPaths.clientCertificate);
            mqttSettings.key = readFileSync(this.settingsPaths.privateKey);
            mqttSettings.passphrase = this.mqttSettingsHelper.loadPassphrase();
        } else {
            LOGGER.log('Username and password will be used to connect to the broker', ESyslogEventFilter.debug);
            const userCredentials: Credentials = this.mqttSettingsHelper.loadUserCredentials();
            mqttSettings.username = userCredentials.username;
            mqttSettings.password = userCredentials.password;
            mqttSettings.rejectUnauthorized = false;
        }
    }

    private hasRequiredCertCredentials(): boolean {
        return existsSync(this.settingsPaths.clientCertificate) &&
            existsSync(this.settingsPaths.caCertificate) &&
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

export class MqttCredentialsHelper extends BaseCredentialsHelper {
    constructor(settingsPaths: IBaseSettingsPaths) {
        super(settingsPaths);
    }
}



