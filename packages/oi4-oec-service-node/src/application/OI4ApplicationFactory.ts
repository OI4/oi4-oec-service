import {
    BrokerConfiguration,
    MqttSettings,
    Credentials,
} from './MqttSettings';
// @ts-ignore
import os from 'os';
import {ESyslogEventFilter, IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {OI4Application} from './OI4Application';
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {BaseCredentialsHelper} from '../Utilities/Helpers/BaseCredentialsHelper';
import {OPCUABuilder} from "@oi4/oi4-oec-service-opcua-model";
import {ClientPayloadHelper} from "../Utilities/Helpers/ClientPayloadHelper";
import {ClientCallbacksHelper} from "../Utilities/Helpers/ClientCallbacksHelper";
import {DefaultSettingsPaths, ISettingsPaths} from "../Config/SettingsPaths";

// eslint-disable-next-line @typescript-eslint/naming-convention
const MQTTS = 'mqtts';

export interface IOI4MessageBusFactory {
    createOI4Application: () => OI4Application;
}

export class OI4ApplicationFactory implements IOI4MessageBusFactory {

    opcUaBuilder: OPCUABuilder;
    clientPayloadHelper: ClientPayloadHelper;
    clientCallbacksHelper: ClientCallbacksHelper;

    private readonly resources: IOI4ApplicationResources;
    private readonly settingsPaths: ISettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;

    constructor(resources: IOI4ApplicationResources, settingsPaths: ISettingsPaths = DefaultSettingsPaths) {
        this.resources = resources;
        this.settingsPaths = settingsPaths;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        initializeLogger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);

        this.opcUaBuilder = new OPCUABuilder(this.resources.oi4Id, this.resources.mam.DeviceClass);
        this.clientPayloadHelper = new ClientPayloadHelper();
        this.clientCallbacksHelper = new ClientCallbacksHelper(this.clientPayloadHelper);
    }

    createOI4Application(): OI4Application {
        // TODO handle missing files
        const brokerConfiguration: BrokerConfiguration = JSON.parse(readFileSync(this.settingsPaths.mqttSettings.brokerConfig, 'utf8'));
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
        return OI4Application.builder()//
            .withApplicationResources(this.resources)//
            .withMqttSettings(mqttSettings)//
            .withOPCUABuilder(this.opcUaBuilder)//
            .withClientPayloadHelper(this.clientPayloadHelper)//
            .withClientCallbacksHelper(this.clientCallbacksHelper)//
            .build();
    }

    private initCredentials(mqttSettings: MqttSettings) {
        if (this.hasRequiredCertCredentials()) {
            LOGGER.log('Client certificates will be used to connect to the broker', ESyslogEventFilter.debug);
            const mqttSettingsPaths = this.settingsPaths.mqttSettings;
            mqttSettings.ca = readFileSync(mqttSettingsPaths.caCertificate);
            mqttSettings.cert = readFileSync(mqttSettingsPaths.clientCertificate);
            mqttSettings.key = readFileSync(mqttSettingsPaths.privateKey);
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
        const mqttSettingsPaths = this.settingsPaths.mqttSettings;
        return existsSync(mqttSettingsPaths.clientCertificate) &&
            existsSync(mqttSettingsPaths.caCertificate) &&
            existsSync(mqttSettingsPaths.privateKey)
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
    constructor(settingsPaths: ISettingsPaths) {
        super(settingsPaths.mqttSettings);
    }
}
