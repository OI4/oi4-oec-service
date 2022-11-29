import os from 'os';
import {ESyslogEventFilter, IOI4ApplicationResources, OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-model';
import {initializeLogger, logger} from '@oi4/oi4-oec-service-logger';
import {existsSync, readFileSync} from 'fs';
import {IOI4Application, OI4Application, OI4ApplicationBuilder} from './OI4Application';
import {BrokerConfiguration, Credentials, MqttSettings} from './MqttSettings';
import {defaultSettingsPaths, ISettingsPaths} from '../configuration/SettingsPaths';
import {ClientPayloadHelper} from '../messaging/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../messaging/ClientCallbacksHelper';
import {MqttMessageProcessor} from '../messaging/MqttMessageProcessor';
import {BaseCredentialsHelper} from '../utilities/BaseCredentialsHelper';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MQTTS = 'mqtts';

export interface IOI4ApplicationFactory {
    createOI4Application: () => IOI4Application;
    initialize: () => IOI4ApplicationFactory;
    builder: OI4ApplicationBuilder;
}

export class OI4ApplicationFactory implements IOI4ApplicationFactory {

    builder: OI4ApplicationBuilder;

    clientPayloadHelper: ClientPayloadHelper;
    clientCallbacksHelper: ClientCallbacksHelper;
    mqttMessageProcessor: MqttMessageProcessor;
    opcUaBuilder: OPCUABuilder;

    private readonly resources: IOI4ApplicationResources;
    private readonly settingsPaths: ISettingsPaths;
    private readonly mqttSettingsHelper: MqttCredentialsHelper;
    private readonly serviceType: ServiceTypes;

    constructor(resources: IOI4ApplicationResources, settingsPaths: ISettingsPaths = defaultSettingsPaths) {
        this.resources = resources;
        this.settingsPaths = settingsPaths;
        this.serviceType = this.resources.mam.getServiceType();
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        this.mqttSettingsHelper = new MqttCredentialsHelper(this.settingsPaths);
        initializeLogger(true, 'OI4MessageBusFactory', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, ESyslogEventFilter.error, resources.oi4Id, this.serviceType);

        this.clientPayloadHelper = new ClientPayloadHelper();
        this.clientCallbacksHelper = new ClientCallbacksHelper();
        this.mqttMessageProcessor = new MqttMessageProcessor();
    }

    createOI4Application(): IOI4Application {
        if (this.builder === undefined) {
            this.initialize();
        }
        return this.builder.build();
    }

    initialize(builder = OI4Application.builder()): IOI4ApplicationFactory {
        const brokerConfiguration: BrokerConfiguration = JSON.parse(readFileSync(this.settingsPaths.mqttSettings.brokerConfig, 'utf8'));
        const maximumPacketSize = OI4ApplicationFactory.getMaxPacketSize(brokerConfiguration);
        const mqttSettings: MqttSettings = {
            clientId: os.hostname(),
            host: brokerConfiguration.Address,
            port: brokerConfiguration.SecurePort,
            protocol: MQTTS,
            properties: {
                maximumPacketSize: maximumPacketSize
            }
        }

        if (this.opcUaBuilder === undefined) {
            this.opcUaBuilder = new OPCUABuilder(this.resources.oi4Id, this.serviceType, maximumPacketSize);
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

    private initCredentials(mqttSettings: MqttSettings): void {
        if (this.hasRequiredCertCredentials()) {
            logger.log('Client certificates will be used to connect to the broker', ESyslogEventFilter.debug);
            const mqttSettingsPaths = this.settingsPaths.mqttSettings;
            mqttSettings.ca = readFileSync(mqttSettingsPaths.caCertificate);
            mqttSettings.cert = readFileSync(mqttSettingsPaths.clientCertificate);
            mqttSettings.key = readFileSync(mqttSettingsPaths.privateKey);
            mqttSettings.passphrase = this.mqttSettingsHelper.loadPassphrase();
        } else {
            logger.log('Username and password will be used to connect to the broker', ESyslogEventFilter.debug);
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
        const maxPacketSize = brokerConfiguration.MaxPacketSize | 256;
        return maxPacketSize >= 256 ? maxPacketSize : 256;
    }

}

export class MqttCredentialsHelper extends BaseCredentialsHelper {
    constructor(settingsPaths: ISettingsPaths) {
        super(settingsPaths.mqttSettings);
    }
}
