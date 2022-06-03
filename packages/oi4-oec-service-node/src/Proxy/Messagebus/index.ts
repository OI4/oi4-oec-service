import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {IContainerState} from '../../Container/index';
import {IOPCUANetworkMessage, IOPCUAPayload} from '@oi4/oi4-oec-service-opcua-model';
import {OI4Proxy} from '../index';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {CDataSetWriterIdLookup, IContainerHealth} from '@oi4/oi4-oec-service-model';

import {MqttSettingsHelper} from '../../Utilities/Helpers/MqttSettingsHelper';
// DataSetClassIds
import {DataSetClassIds} from '@oi4/oi4-oec-service-model';
import {ISpecificContainerConfig} from '@oi4/oi4-oec-service-model';
import {EDeviceHealth, ESubscriptionListConfig, ESyslogEventFilter} from '@oi4/oi4-oec-service-model';
import {MQTT_PATH_SETTINGS, MqttSettings} from './MqttSettings';
import {readFileSync, existsSync} from 'fs';
import {
    Credentials, SendResourceCreatePayloadResult,
    ServerObject,
    ValidatedFilter
} from '../../Utilities/Helpers/Types';
import os from 'os';
import {ClientPayloadHelper} from '../../Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from "../../Utilities/Helpers/ClientCallbacksHelper";
import {emit} from "cluster";

class OI4MessageBusProxy extends OI4Proxy {
    private readonly clientHealthHeartbeatInterval: number = 60000;

    private clientCallbacksHelper: ClientCallbacksHelper = new ClientCallbacksHelper();
    private mqttSettingsHelper: MqttSettingsHelper = new MqttSettingsHelper();
    private clientPayloadHelper: ClientPayloadHelper;

    private readonly client: mqtt.AsyncClient;
    private logger: Logger;

    /***
     * @param container -> is the container state of the app. Contains mam settings oi4id, health and so on
     * @param mqttPreSettings -> contains mqtt presettings for connection. for example host and port
     * The constructor initializes the mqtt settings and establish a conection and listeners
     * In Addition birth, will and close messages will be also created
     */
    constructor(container: IContainerState, mqttPreSettings: MqttSettings) {
        super(container);

        // Add Server Object depending on configuration
        const serverObj: ServerObject = {
            host: mqttPreSettings.host,
            port: mqttPreSettings.port,
        };
        console.log(`MQTT: Trying to connect with ${serverObj.host}:${serverObj.port}`);

        // Initialize MQTT Options
        const mqttOpts: MqttSettings = this.createMqttOptions(serverObj);

        if (this.hasRequiredCertCredentials()) {
            mqttOpts.cert = readFileSync(MQTT_PATH_SETTINGS.CLIENT_CERT);
            mqttOpts.ca = readFileSync(MQTT_PATH_SETTINGS.CA_CERT);
            mqttOpts.key = readFileSync(MQTT_PATH_SETTINGS.PRIVATE_KEY);
            mqttOpts.passphrase = existsSync(MQTT_PATH_SETTINGS.PASSPHRASE) ? readFileSync(MQTT_PATH_SETTINGS.PASSPHRASE) : undefined;;
        } else {
            const userCredentials: Credentials = this.mqttSettingsHelper.loadUserCredentials();
            mqttOpts.username = userCredentials.username;
            mqttOpts.password = userCredentials.password;
            mqttOpts.protocol = 'mqtts';
            mqttOpts.rejectUnauthorized = false;
        }

        console.log(`Connecting to MQTT broker with client ID: ${mqttOpts.clientId}`);

        this.client = mqtt.connect(mqttOpts);

        this.logger = new Logger(true, 'Registry-BusProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, this.client, this.oi4Id, this.serviceType);
        this.logger.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.warning);

        this.clientPayloadHelper = new ClientPayloadHelper(this.logger);

        this.initClientCallbacks();
    }

    private createMqttOptions(serverObj: ServerObject): MqttSettings {
        return {
            clientId: os.hostname(),
            servers: [serverObj],
            protocol: 'mqtts',
            will: {
                topic: `oi4/${this.serviceType}/${this.oi4Id}/pub/health/${this.oi4Id}`,
                payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                    payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0),
                    dswid: CDataSetWriterIdLookup['health']
                }], new Date(), DataSetClassIds.health)), /*tslint:disable-line*/
                qos: 0,
                retain: false,
            },
        };
    }

    private initClientCallbacks() {
        this.setOnClientErrorCallback();
        this.setOnClientCloseCallback();
        this.setOnClientDisconnectCallback();
        this.setOnClientReconnectCallback();
        this.setOnClientConnectCallback();
    }

    private setOnClientErrorCallback() {
        //FIXME This is a proposal refactoring using an helper, must be evaluated and therefore the code must be adjusted accordingly
        this.client.on('error', async(err: Error) => this.clientCallbacksHelper.onErrorCallback(err));
        /*
        this.client.on('error', async (err: Error) => {
            console.log(`Error in mqtt client: ${err}`);
        });
        */
    }

    private setOnClientCloseCallback() {
        //FIXME This is a proposal refactoring using an helper, must be evaluated and therefore the code must be adjusted accordingly
        this.client.on('close', async() => this.clientCallbacksHelper.onCloseCallback(this.containerState, this.client, this.topicPreamble, this. oi4Id, this.builder));
        /*
        this.client.on('close', async () => {
            this.containerState.brokerState = false;
            await this.client.publish(
                `${this.topicPreamble}/pub/mam/${this.oi4Id}`,
                JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                    payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                    dswid: CDataSetWriterIdLookup['health']
                }], new Date(), DataSetClassIds.mam)),
            );
            console.log('Connection to mqtt broker closed');
        });
        */
    }

    private setOnClientDisconnectCallback() {
        this.client.on('disconnect', async () => {
            this.containerState.brokerState = false;
            console.log('Disconnected from mqtt broker');
        });
    }

    private setOnClientReconnectCallback() {
        this.client.on('reconnect', async () => {
            this.containerState.brokerState = false;
            console.log('Reconnecting to mqtt broker');
        });
    }

    private setOnClientConnectCallback() {
        // Publish Birth Message and start listening to topics
        this.client.on('connect', async () => {//connack: mqtt.IConnackPacket) => {
            this.logger.log('Connected successfully', ESyslogEventFilter.warning);
            this.containerState.brokerState = true;

            await this.client.publish(
                `${this.topicPreamble}/pub/mam/${this.oi4Id}`,
                JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                    payload: this.containerState.mam,
                    dswid: CDataSetWriterIdLookup['mam']
                }], new Date(), DataSetClassIds.mam)),
            );
            this.logger.log(`Published Birthmessage on ${this.topicPreamble}/pub/mam/${this.oi4Id}`, ESyslogEventFilter.warning);

            // Listen to own routes
            this.ownSubscribe(`${this.topicPreamble}/get/#`);
            this.ownSubscribe(`${this.topicPreamble}/set/#`);
            this.ownSubscribe(`${this.topicPreamble}/del/#`);

            this.client.on('message', this.processMqttMessage);

            this.initClientHealthHeartBeat();

            this.containerState.on('resourceChanged', this.resourceChangeCallback.bind(this));
        });
    }

    private async ownSubscribe(topic: string):  Promise<mqtt.ISubscriptionGrant[]> {
        this.containerState.subscriptionList.subscriptionList.push({
            topicPath: topic,
            config: ESubscriptionListConfig.NONE_0,
            interval: 0,
        });
        return await this.client.subscribe(topic);
    }

    private initClientHealthHeartBeat() {
        setInterval(() => {
            this.sendResource('health', '', this.oi4Id);
        }, this.clientHealthHeartbeatInterval); // send our own health every 30 seconds!
    }

    private resourceChangeCallback(resource: string): void {
        if (resource === 'health') {
            this.sendResource('health', '', this.oi4Id);
        }
    }

    private hasRequiredCertCredentials(): boolean {
        return existsSync(MQTT_PATH_SETTINGS.CA_CERT) &&
            existsSync(MQTT_PATH_SETTINGS.CLIENT_CERT) &&
            existsSync(MQTT_PATH_SETTINGS.PRIVATE_KEY)
    }
    // private async ownUnsubscribe(topic: string) {
    //   // Remove from subscriptionList
    //   this.containerState.subscriptionList.subscriptionList = this.containerState.subscriptionList.subscriptionList.filter(value => value.topicPath !== topic);
    //   return await this.client.unsubscribe(topic);
    // }

    /**
     * Processes the incoming mqtt message by parsing the different elements of the topic and reacting to it
     * @param topic - the incoming topic from the messagebus
     * @param message - the entire binary message from the messagebus
     */
    private processMqttMessage = async (topic: string, message: Buffer) => {
        // Convert message to JSON, TODO: if this fails, we return an Error
        let parsedMessage: IOPCUANetworkMessage;
        try {
            parsedMessage = JSON.parse(message.toString());
        } catch (e) {
            this.logger.log(`Error when parsing JSON in processMqttMessage: ${e}`, ESyslogEventFilter.warning);
            return;
        }
        let schemaResult = false;
        try {
            schemaResult = await this.builder.checkOPCUAJSONValidity(parsedMessage);
        } catch (e) {
            this.logger.log(`OPC UA validation failed with: ${typeof e === 'string' ? e : JSON.stringify(e)}`, ESyslogEventFilter.warning);
        }

        if (parsedMessage.Messages.length === 0) {
            this.logger.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.informational);
        }

        if (!schemaResult) {
            this.logger.log('Error in pre-check (crash-safety) schema validation, please run asset through conformity validation or increase logLevel', ESyslogEventFilter.warning);
            return;
        }

        if (!this.builder.checkTopicPath(topic)) {
            this.logger.log('Error in pre-check topic Path, please correct topic Path', ESyslogEventFilter.warning);
            return;
        }

        // Split the topic into its different elements
        const topicArray = topic.split('/');
        //const topicServiceType = topicArray[1];
        const topicAppId = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
        const topicMethod = topicArray[6];
        const topicResource = topicArray[7];
        const topicFilter = topicArray.splice(8).join('/');

        // Safety-Check: DataSetClassId
        if (parsedMessage.DataSetClassId !== DataSetClassIds[topicResource]) {
            this.logger.log(`Error in pre-check, dataSetClassId mismatch, got ${parsedMessage.DataSetClassId}, expected ${DataSetClassIds[topicResource]}`, ESyslogEventFilter.warning);
            return;
        }

        // The following switch/case reacts depending on the different topic elements
        // The message is directed directly at us
        if (topicAppId === this.oi4Id) {
            switch (topicMethod) {
                case 'get': {
                    if (topicResource === 'data') {
                        //FIXME is this correct? Or it is just "emit"?
                        this.emit('getData', {topic, message: parsedMessage});
                        break;
                    }
                    if (topicResource === 'metadata') {
                        await this.sendMetaData(topicFilter);
                        break;
                    }

                    let payloadType = 'empty';
                    let page = 0;
                    let perPage = 0;

                    if (parsedMessage.Messages.length !== 0) {
                        for (const messages of parsedMessage.Messages) {
                            payloadType = await this.builder.checkPayloadType(messages.Payload);
                            if (payloadType === 'locale') {
                                this.logger.log('Detected a locale request, but we can only send en-US!', ESyslogEventFilter.informational);
                            }
                            if (payloadType === 'pagination') {
                                page = messages.Payload.page;
                                perPage = messages.Payload.perPage;
                                if (page === 0 || perPage === 0) {
                                    this.logger.log('Pagination requested either page or perPage 0, aborting send...');
                                    return;
                                }
                            }
                            if (payloadType === 'none') { // Not empty, locale or pagination
                                this.logger.log('Message must be either empty, locale or pagination type in a /get/ request. Aboring get operation.', ESyslogEventFilter.informational);
                                return;
                            }
                        }
                    }

                    this.sendResource(topicResource, parsedMessage.MessageId, topicFilter, page, perPage)
                    break;
                }
                case 'pub': {
                    break; // Only break here, because we should not react to our own publication messages
                }
                case 'set': {
                    switch (topicResource) {
                        case 'data': {
                            this.setData(topicFilter, parsedMessage);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                    break;
                }
                case 'del': {
                    switch (topicResource) {
                        case 'data': {
                            this.deleteData(topicFilter);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
            // External Request (External device put this on the message bus, we need this for birth messages)
        } else {
            this.logger.log(`Detected Message from: ${topicAppId}`)
        }
    }

    // GET SECTION ----------------//
    /**
     * Sends all available metadata of the containerState to the bus
     * @param cutTopic - the cutTopic, containing only the tag-element
     */
    async sendMetaData(cutTopic: string) {
        const tagName = cutTopic; // Remove the leading /
        if (tagName === '') { // If there is no tag specified, we should send all available metadata
            await this.client.publish(`${this.topicPreamble}/pub/metadata`, JSON.stringify(this.containerState.metaDataLookup));
            this.logger.log(`Published ALL available MetaData on ${this.topicPreamble}/pub/metadata`);
            return;
        }
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName in dataLookup) {
            await this.client.publish(`${this.topicPreamble}/pub/metadata/${tagName}`, JSON.stringify(this.containerState.metaDataLookup[tagName]));
            this.logger.log(`Published available MetaData on ${this.topicPreamble}/pub/metadata/${tagName}`);
        }
    }

    /**
     * Sends all available data of the containerState to the bus
     * @param cutTopic - the cuttopic, containing only the tag-element
     */
    async sendData(cutTopic: string) {
        const tagName = cutTopic;
        if (tagName === '') { // If there is no tag specified, we shuld send all available data
            await this.client.publish(`${this.topicPreamble}/pub/data`, JSON.stringify(this.containerState.dataLookup));
            this.logger.log(`Published ALL available Data on ${this.topicPreamble}/pub/data`);
            return;
        }
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName in dataLookup) {
            await this.client.publish(`${this.topicPreamble}/pub/data/${tagName}`, JSON.stringify(this.containerState.dataLookup[tagName]));
            this.logger.log(`Published available Data on ${this.topicPreamble}/pub/data/${tagName}`);
        }
    }

    private validateFilter(filter: string): ValidatedFilter {
        // Initialized with -1, so we know when to use string-based filters or not
        let dswidFilter = -1;

        try {
            dswidFilter = parseInt(filter, 10);
            if (dswidFilter === 0) {
                this.logger.log('0 is not a valid DSWID', ESyslogEventFilter.warning);
                return {isValid: false, dswidFilter: undefined };
            }
        } catch (err) {
            this.logger.log('Error when trying to parse filter as a DSWID, falling back to string-based filters...', ESyslogEventFilter.warning);
            return {isValid: false, dswidFilter: undefined };
        }

        return {isValid: true, dswidFilter: dswidFilter };
    }

    /**
     * Sends the saved Resource from containerState to the message bus
     * @param resource - the resource that is to be sent to the bus (health, license etc.)
     * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
     * @param [filter] - the tag of the resource
     */
    async sendResource(resource: string, messageId: string, filter: string, page = 0, perPage = 0) {
        const validatedFilter = this.validateFilter(filter);
        if(!validatedFilter.isValid) {
            return;
        }

        const dswidFilter: number = validatedFilter.dswidFilter;
        let payloadResult: SendResourceCreatePayloadResult;
        let payload: IOPCUAPayload[] = [];

        switch (resource) {
            case 'mam':
            case 'health':
            case 'profile':
            case 'rtLicense': { // This is the default case, just send the resource if the tag is ok
                payloadResult = this.clientPayloadHelper.createDefaultSendResourcePayload(this.oi4Id, this.containerState, resource, messageId, filter, page, perPage, dswidFilter);
                break;
            }
            case 'licenseText': {
                payloadResult = this.clientPayloadHelper.createLicenseTextSendResourcePayload(this.containerState, filter, resource);
                break;
            }
            case 'license': {
                payloadResult = this.clientPayloadHelper.createLicenseSendResourcePayload(this.containerState, filter, dswidFilter, resource);
                break;
            }
            case 'publicationList': {
                payloadResult = this.clientPayloadHelper.createPublicationListSendResourcePayload(this.containerState, filter, dswidFilter, resource);
                break;
            }
            case 'subscriptionList': {
                payloadResult = this.clientPayloadHelper.createSubscriptionListSendResourcePayload(this.containerState, filter, dswidFilter, resource);
                break;
            }
            case 'config': {
                payloadResult = this.clientPayloadHelper.createConfigSendResourcePayload(this.containerState, filter, dswidFilter, resource);
                break;
            }
            default: {
                await this.sendError(`Unknown Resource: ${resource}`);
                return;
            }
        }

        if(payloadResult.abortSending) {
            return;
        }

        payload = payloadResult.payload;

        // Don't forget the slash
        const endTag: string = filter === '' ? filter : `/${filter}`;

        try {
            const networkMessageArray = this.builder.buildPaginatedOPCUANetworkMessageArray(payload, new Date(), DataSetClassIds[resource], messageId, page, perPage);
            if (typeof networkMessageArray[0] === 'undefined') {
                this.logger.log('Error in paginated NetworkMessage creation, most likely a page was requested which is out of range', ESyslogEventFilter.warning);
            }
            for (const [nmIdx, networkMessages] of networkMessageArray.entries()) {
                await this.client.publish(
                    `${this.topicPreamble}/pub/${resource}${endTag}`,
                    JSON.stringify(networkMessages));
                this.logger.log(`Published ${resource} Pagination: ${nmIdx} of ${networkMessageArray.length} on ${this.topicPreamble}/pub/${resource}${endTag}`);
            }
        } catch {
            console.log('Error in building paginated NMA');
        }
    }

    /**
     * Sends an event/event with a specified level to the message bus
     * @param eventStr - The string that is to be sent as the 'event'
     * @param level - the level that is used as a <subresource> element in the event topic
     */
    async sendEvent(eventStr: string, level: string) {
        const opcUAEvent = this.builder.buildOPCUANetworkMessage([{
            number: 1,
            description: 'Registry sendEvent',
            payload: {
                logLevel: level,
                logString: eventStr,
            },
            dswid: CDataSetWriterIdLookup['event'],
        }], new Date(), DataSetClassIds.event); /*tslint:disable-line*/
        await this.client.publish(`${this.topicPreamble}/pub/event/${level}/${this.oi4Id}`, JSON.stringify(opcUAEvent));
        this.logger.log(`Published event on ${this.topicPreamble}/event/${level}/${this.oi4Id}`);
    }

    // Basic Error Functions
    async sendError(error: string) {
        this.logger.log(`Error: ${error}`, ESyslogEventFilter.error);
    }

    // SET Function section ------//
    setData(cutTopic: string, data: IOPCUANetworkMessage) {
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if (!(tagName in dataLookup)) {
            this.containerState.dataLookup[tagName] = data;
            this.logger.log(`Added ${tagName} to dataLookup`);
        } else {
            this.containerState.dataLookup[tagName] = data; // No difference if we create the data or just update it with an object
            this.logger.log(`${tagName} already exists in dataLookup`);
        }
    }

    // DELETE Function section
    /**
     * Legacy: TODO: This is not specified by the specification yet
     * @param cutTopic - todo
     */
    deleteData(cutTopic: string) {
        // ONLY SPECIFIC DATA CAN BE DELETED. WILDCARD DOES NOT DELETE EVERYTHING
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if ((tagName in dataLookup)) {
            delete this.containerState.dataLookup[tagName];
            this.logger.log(`Deleted ${tagName} from dataLookup`, ESyslogEventFilter.warning);
        } else {
            this.logger.log(`Cannot find ${tagName} in lookup`, ESyslogEventFilter.warning);
        }
    }

    /**
     * Makes the MQTT Client available to be used by other applications
     */
    get mqttClient() {
        return this.client;
    }
}

export {OI4MessageBusProxy};
