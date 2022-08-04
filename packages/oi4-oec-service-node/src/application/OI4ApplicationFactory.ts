import {
    BrokerConfiguration,
    MqttSettings,
    Credentials,
} from './MqttSettings';
// @ts-ignore
import os from 'os';
import {ESyslogEventFilter, IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {existsSync, readFileSync} from 'fs';
import {OI4Application, OI4ApplicationBuilder} from './OI4Application';
import {BaseCredentialsHelper} from '../Utilities/Helpers/BaseCredentialsHelper';
import {ClientPayloadHelper} from '../Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../Utilities/Helpers/ClientCallbacksHelper';
import {DefaultSettingsPaths, ISettingsPaths} from '../Config/SettingsPaths';
import {MqttMessageProcessor} from '../Utilities/Helpers/MqttMessageProcessor';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MQTTS = 'mqtts';

export interface IOI4MessageBusFactory {
    createOI4Application: () => OI4Application;
    initialize: () => IOI4MessageBusFactory;
    builder: OI4ApplicationBuilder;
}

export class OI4ApplicationFactory implements IOI4MessageBusFactory {

    builder: OI4ApplicationBuilder;

    opcUaBuilder: OPCUABuilder;
    clientPayloadHelper: ClientPayloadHelper;
    clientCallbacksHelper: ClientCallbacksHelper;
    mqttMessageProcessor: MqttMessageProcessor;

    private readonly resources: IOI4ApplicationResources;
    private readonly settingsPaths: ISettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;

    constructor(resources: IOI4ApplicationResources, settingsPaths: ISettingsPaths = DefaultSettingsPaths) {
        this.resources = resources;
        this.settingsPaths = settingsPaths;
        const serviceType = this.resources.mam.getServiceType();
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        initializeLogger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, ESyslogEventFilter.error, resources.oi4Id, serviceType);

        this.opcUaBuilder = new OPCUABuilder(this.resources.oi4Id, serviceType);
        this.clientPayloadHelper = new ClientPayloadHelper();
        this.clientCallbacksHelper = new ClientCallbacksHelper();
        this.mqttMessageProcessor = new MqttMessageProcessor();
    }

    createOI4Application(): OI4Application {
        if(this.builder === undefined) {
            this.initialize();
        }
        return this.builder.build();
    }

    initialize(builder = OI4Application.builder()) {
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
        this.builder = builder//
            .withApplicationResources(this.resources)//
            .withMqttSettings(mqttSettings)//
            .withOPCUABuilder(this.opcUaBuilder)//
            .withClientPayloadHelper(this.clientPayloadHelper)//
            .withClientCallbacksHelper(this.clientCallbacksHelper)//
            .withMqttMessageProcessor(this.mqttMessageProcessor)//
        return this;
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
