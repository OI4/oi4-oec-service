import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EventEmitter} from 'events';
import {initializeLogger, LOGGER, updateMqttClient} from '@oi4/oi4-oec-service-logger';
// DataSetClassIds
import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESubscriptionListConfig,
    StatusEvent,
    ESyslogEventFilter,
    IOI4ApplicationResources,
    IEvent
} from '@oi4/oi4-oec-service-model';
import {ValidatedFilter, ValidatedPayload} from '../Utilities/Helpers/Types';
import {ClientPayloadHelper} from '../Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../Utilities/Helpers/ClientCallbacksHelper';
import {MqttMessageProcessor} from '../Utilities/Helpers/MqttMessageProcessor';
import {IOPCUANetworkMessage, IOPCUADataSetMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {MqttSettings} from './MqttSettings';
import {AsyncClientEvents, ResourceType} from '../Utilities/Helpers/Enums';

class OI4Application extends EventEmitter {

    public oi4Id: string;
    public serviceType: string;
    public applicationResources: IOI4ApplicationResources;
    public topicPreamble: string;
    public builder: OPCUABuilder;

    private readonly clientHealthHeartbeatInterval: number = 60000;
    private readonly clientPayloadHelper: ClientPayloadHelper;
    private readonly client: mqtt.AsyncClient;

    private clientCallbacksHelper: ClientCallbacksHelper;
    private mqttMessageProcessor: MqttMessageProcessor;

    /***
     * @param applicationResources -> is the applicationResources state of the app. Contains mam settings oi4id, health and so on
     * @param mqttSettings
     * The constructor initializes the mqtt settings and establish a conection and listeners
     * In Addition birth, will and close messages will be also created
     */

    constructor(applicationResources: IOI4ApplicationResources, mqttSettings: MqttSettings) {

        super();
        this.oi4Id = applicationResources.oi4Id;
        this.serviceType = applicationResources.mam.DeviceClass;
        this.builder = new OPCUABuilder(this.oi4Id, this.serviceType);
        this.topicPreamble = `oi4/${this.serviceType}/${this.oi4Id}`;
        this.applicationResources = applicationResources;

        this.clientPayloadHelper = new ClientPayloadHelper();

        mqttSettings.will = {
            topic: `oi4/${this.serviceType}/${this.oi4Id}/pub/health/${this.oi4Id}`,
            payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                subResource: this.oi4Id,
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0),
                DataSetWriterId: CDataSetWriterIdLookup[ResourceType.HEALTH]
            }], new Date(), DataSetClassIds.health)), /*tslint:disable-line*/
            qos: 0,
            retain: false,
        }

        initializeLogger(true, mqttSettings.clientId, process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, undefined, this.oi4Id, this.serviceType);
        LOGGER.log(`MQTT: Trying to connect with ${mqttSettings.host}:${mqttSettings.port} and client ID: ${mqttSettings.clientId}`);
        this.client = mqtt.connect(mqttSettings);

        updateMqttClient(this.client);
        LOGGER.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.warning);
        this.clientPayloadHelper = new ClientPayloadHelper();
        this.clientCallbacksHelper = new ClientCallbacksHelper(this.clientPayloadHelper);
        this.on('setConfig', this.sendEventStatus);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.mqttMessageProcessor = new MqttMessageProcessor(this.applicationResources, this.sendMetaData, this.sendResource, super.removeListener('',()=>{}));

        this.initClientCallbacks();
    }

    private initClientCallbacks() {
        this.setOnClientErrorCallback();
        this.setOnClientCloseCallback();
        this.setOnClientDisconnectCallback();
        this.setOnClientReconnectCallback();
        this.setOnClientConnectCallback();
    }

    private setOnClientErrorCallback() {
        this.client.on(AsyncClientEvents.ERROR, async (err: Error) => this.clientCallbacksHelper.onErrorCallback(err));
    }

    private setOnClientCloseCallback() {
        this.client.on(AsyncClientEvents.CLOSE, async () => this.clientCallbacksHelper.onCloseCallback(this.applicationResources, this.client, this.topicPreamble, this.oi4Id, this.builder));
    }

    private setOnClientDisconnectCallback() {
        this.client.on(AsyncClientEvents.DISCONNECT, async () => this.clientCallbacksHelper.onDisconnectCallback(this.applicationResources));
    }

    private setOnClientReconnectCallback() {
        this.client.on(AsyncClientEvents.RECONNECT, async () => this.clientCallbacksHelper.onReconnectCallback(this.applicationResources));
    }

    private setOnClientConnectCallback() {
        // Publish Birth Message and start listening to topics
        this.client.on(AsyncClientEvents.CONNECT, async () => {
            await this.clientCallbacksHelper.onClientConnectCallback(this.applicationResources, this.client, this.topicPreamble, this.oi4Id, this.builder);
            await this.initIncomingMessageListeners();
            this.initClientHealthHeartBeat();
            this.applicationResources.on(AsyncClientEvents.RESOURCE_CHANGED, this.resourceChangeCallback.bind(this));
        });
    }

    private async initIncomingMessageListeners() {
        // Listen to own routes
        await this.ownSubscribe(`${this.topicPreamble}/get/#`);
        await this.ownSubscribe(`${this.topicPreamble}/set/#`);
        await this.ownSubscribe(`${this.topicPreamble}/del/#`);
        this.client.on(AsyncClientEvents.MESSAGE, this.mqttMessageProcessor.processMqttMessage);
    }

    private async ownSubscribe(topic: string): Promise<mqtt.ISubscriptionGrant[]> {
        this.applicationResources.subscriptionList.push({
            topicPath: topic,
            config: ESubscriptionListConfig.NONE_0,
            interval: 0,
        });
        return await this.client.subscribe(topic);
    }

    private initClientHealthHeartBeat() {
        setInterval(() => {
            this.sendResource(ResourceType.HEALTH, '', '', this.oi4Id).then(() => {
                //No actual actions are needed here
            });
        }, this.clientHealthHeartbeatInterval); // send our own health every 60 seconds!
    }

    private resourceChangeCallback(resource: string) {
        if (resource === ResourceType.HEALTH) {
            this.sendResource(ResourceType.HEALTH, '', '', this.oi4Id).then();
        }
    }

    // FIXME: Shall we remove this commented code?
    // private async ownUnsubscribe(topic: string) {
    //   // Remove from subscriptionList
    //   this.applicationResources.subscriptionList.subscriptionList = this.applicationResources.subscriptionList.subscriptionList.filter(value => value.topicPath !== topic);
    //   return await this.client.unsubscribe(topic);
    // }

    // GET SECTION ----------------//
    /**
     * Sends all available metadata of the applicationResources to the bus
     * @param cutTopic - the cutTopic, containing only the tag-element
     */
    async sendMetaData(cutTopic: string) {
        await this.send(cutTopic, 'metadata', this.applicationResources.metaDataLookup);
    }

    //FIXME is this sendData even used somewhere?
    /**
     * Sends all available data of the applicationResources to the bus
     * @param cutTopic - the cuttopic, containing only the tag-element
     */
    async sendData(cutTopic: string) {
        await this.send(cutTopic, 'data', this.applicationResources.dataLookup);
    }

    //FIXME add a better type for the information send (Either data or metadata)
    private async send(tagName: string, type: string, information: any) {
        if (tagName === '') { // If there is no tag specified, we should send all available metadata
            await this.client.publish(`${this.topicPreamble}/pub/${type}`, JSON.stringify(information));
            LOGGER.log(`Published ALL available ${type.toUpperCase()} on ${this.topicPreamble}/pub/${type}`);
            return;
        }
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (tagName in dataLookup) {
            await this.client.publish(`${this.topicPreamble}/pub/${type}/${tagName}`, JSON.stringify(information[tagName]));
            LOGGER.log(`Published available ${type.toUpperCase()} on ${this.topicPreamble}/pub/${type}/${tagName}`);
        }
    }

    /**
     * Sends the saved Resource from applicationResources to the message bus
     * @param resource - the resource that is to be sent to the bus (health, license etc.)
     * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
     * @param [filter] - the tag of the resource
     */
    async sendResource(resource: string, messageId: string, subResource: string, filter: string, page = 0, perPage = 0) {
        const validatedPayload: ValidatedPayload = await this.preparePayload(resource, subResource, filter);

        if (validatedPayload.abortSending) {
            return;
        }

        await this.sendPayload(validatedPayload.payload, resource, messageId, page, perPage, filter);
    }

    async preparePayload(resource: string, subResource: string, filter: string): Promise<ValidatedPayload> {
        const validatedFilter: ValidatedFilter = this.validateFilter(filter);
        if (!validatedFilter.isValid) {
            LOGGER.log('Invalid filter, abort sending...');
            return {payload: undefined, abortSending: true};
        }

        const dswidFilter: number = validatedFilter.dswidFilter;
        let payloadResult: ValidatedPayload;

        switch (resource) {
            case ResourceType.MAM:
            case ResourceType.PROFILE:
            case ResourceType.RT_LICENSE: { // This is the default case, just send the resource if the tag is ok
                payloadResult = this.clientPayloadHelper.createDefaultSendResourcePayload(this.oi4Id, this.applicationResources, resource, filter, dswidFilter);
                break;
            }
            case ResourceType.HEALTH: {
                payloadResult = this.clientPayloadHelper.getDefaultHealthStatePayload(this.oi4Id);
                break;
            }
            case ResourceType.LICENSE_TEXT: {
                payloadResult = this.clientPayloadHelper.createLicenseTextSendResourcePayload(this.applicationResources, filter, resource);
                break;
            }
            case ResourceType.LICENCE: {
                payloadResult = this.clientPayloadHelper.createLicenseSendResourcePayload(this.applicationResources, subResource, filter);
                break;
            }
            case ResourceType.PUBLICATION_LIST: {
                payloadResult = this.clientPayloadHelper.createPublicationListSendResourcePayload(this.applicationResources, filter, dswidFilter, resource);
                break;
            }
            case ResourceType.SUBSCRIPTION_LIST: {
                payloadResult = this.clientPayloadHelper.createSubscriptionListSendResourcePayload(this.applicationResources, filter, dswidFilter, resource);
                break;
            }
            case ResourceType.CONFIG: {
                payloadResult = this.clientPayloadHelper.createConfigSendResourcePayload(this.applicationResources, filter, dswidFilter, resource);
                break;
            }
            default: {
                await this.sendError(`Unknown Resource: ${resource}`);
                return;
            }
        }

        return payloadResult;
    }

    // Basic Error Functions
    async sendError(error: string) {
        LOGGER.log(`Error: ${error}`, ESyslogEventFilter.error);
    }

    private validateFilter(filter: string): ValidatedFilter {
        // Initialized with -1, so we know when to use string-based filters or not
        let dswidFilter = -1;
        try {
            dswidFilter = parseInt(filter, 10);
            if (dswidFilter === 0) {
                LOGGER.log('0 is not a valid DSWID', ESyslogEventFilter.warning);
                return {isValid: false, dswidFilter: undefined};
            }
        } catch (err) {
            LOGGER.log('Error when trying to parse filter as a DSWID, falling back to string-based filters...', ESyslogEventFilter.warning);
            return {isValid: false, dswidFilter: undefined};
        }

        return {isValid: true, dswidFilter: dswidFilter};
    }

    private async sendPayload(payload: IOPCUADataSetMessage[], resource: string, messageId: string, page: number, perPage: number, filter: string) {
        // Don't forget the slash
        const endTag: string = filter === '' ? filter : `/${filter}`;

        try {
            const networkMessageArray: IOPCUANetworkMessage[] = this.builder.buildPaginatedOPCUANetworkMessageArray(payload, new Date(), DataSetClassIds[resource], messageId, page, perPage);
            if (typeof networkMessageArray[0] === 'undefined') {
                LOGGER.log('Error in paginated NetworkMessage creation, most likely a page was requested which is out of range', ESyslogEventFilter.warning);
            }
            for (const [nmIdx, networkMessages] of networkMessageArray.entries()) {
                await this.client.publish(
                    `${this.topicPreamble}/pub/${resource}${endTag}`,
                    JSON.stringify(networkMessages));
                LOGGER.log(`Published ${resource} Pagination: ${nmIdx} of ${networkMessageArray.length} on ${this.topicPreamble}/pub/${resource}${endTag}`);
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
    // TODO figure out how the determine the filter from the actual object/interface, whatever
    async sendEvent(event: IEvent, filter: string) {
        const subResource = event.subResource();
        const payload: IOPCUADataSetMessage[] = this.clientPayloadHelper.createPublishEventMessage(filter, subResource, event);

        const opcUAEvent = this.builder.buildOPCUANetworkMessage(payload, new Date(), DataSetClassIds.event);
        const publishAddress = `${this.topicPreamble}/pub/event/${subResource}/${filter}`;
        await this.client.publish(publishAddress, JSON.stringify(opcUAEvent));
        LOGGER.log(`Published event on ${this.topicPreamble}/event/${subResource}/${filter}`);
    }


    async sendEventStatus(status: StatusEvent) {
        const opcUAStatus = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            subResource: 'status',
            Payload: status,
            DataSetWriterId: CDataSetWriterIdLookup['event'],
        }], new Date(), DataSetClassIds.event); /*tslint:disable-line*/
        await this.client.publish(`${this.topicPreamble}/pub/event/status/${encodeURI(this.builder.publisherId)}`, JSON.stringify(opcUAStatus));
    }

    async getConfig() {
        const opcUAEvent = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            subResource: this.oi4Id,
            Payload: this.applicationResources.config,
            DataSetWriterId: CDataSetWriterIdLookup['config'],
        }], new Date(), DataSetClassIds.event); /*tslint:disable-line*/
        await this.client.publish(`${this.topicPreamble}/get/config/${this.oi4Id}`, JSON.stringify(opcUAEvent));
        LOGGER.log(`Published get config on ${this.topicPreamble}/get/config/${this.oi4Id}`);
    }

    /**
     * Makes the MQTT Client available to be used by other applications
     */
    get mqttClient(): mqtt.AsyncClient {
        return this.client;
    }
    get mqttMessageProcess() {
        return this.mqttMessageProcessor;
    }
}

export {OI4Application};

