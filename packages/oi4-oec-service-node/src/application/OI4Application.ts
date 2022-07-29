import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EventEmitter} from 'events';
import {initializeLogger, LOGGER, updateMqttClient} from '@oi4/oi4-oec-service-logger';
// DataSetClassIds
import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    IEvent,
    IOI4ApplicationResources, MasterAssetModel,
    Resource,
    StatusEvent,
    SubscriptionList,
    SubscriptionListConfig
} from '@oi4/oi4-oec-service-model';
import {ValidatedFilter, ValidatedPayload} from '../Utilities/Helpers/Types';
import {ClientPayloadHelper} from '../Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../Utilities/Helpers/ClientCallbacksHelper';
import {MqttMessageProcessor} from '../Utilities/Helpers/MqttMessageProcessor';
import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    OPCUABuilder,
    ServiceTypes
} from '@oi4/oi4-oec-service-opcua-model';
import {MqttSettings} from './MqttSettings';
import {AsyncClientEvents} from '../Utilities/Helpers/Enums';
import {OI4ResourceEvent} from './OI4Resource';

export interface IOI4Application extends EventEmitter {

    readonly oi4Id: Oi4Identifier;
    serviceType: ServiceTypes;
    applicationResources: IOI4ApplicationResources;
    topicPreamble: string;
    builder: OPCUABuilder;
    readonly client: mqtt.AsyncClient;
    readonly clientPayloadHelper: ClientPayloadHelper;

    addSubscription(topic: string, config: SubscriptionListConfig, interval: number):  Promise<mqtt.ISubscriptionGrant[]>;
    removeSubscription(topic: string): Promise<boolean>;
    sendResource(resource: Resource, messageId: string, subResource: string, filter: string, page: number, perPage: number): Promise<void>;
    sendMetaData(cutTopic: string): Promise<void>;
    sendData(cutTopic: string): Promise<void>;
    sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void>;
    sendEvent(event: IEvent, filter: string): Promise<void>;
    sendEventStatus(status: StatusEvent): Promise<void>;
    getConfig(): Promise<void>;
}

export class OI4Application extends EventEmitter implements IOI4Application {

    public serviceType: ServiceTypes;
    public applicationResources: IOI4ApplicationResources;
    public topicPreamble: string;
    public builder: OPCUABuilder;
    public readonly client: mqtt.AsyncClient;
    public readonly clientPayloadHelper: ClientPayloadHelper;

    private readonly clientHealthHeartbeatInterval: number = 60000;

    private clientCallbacksHelper: ClientCallbacksHelper;
    private readonly mqttMessageProcessor: MqttMessageProcessor;

    static builder() {
        return new OI4ApplicationBuilder();
    };

    /***
     * The constructor initializes the mqtt settings and establish a conection and listeners
     * In Addition birth, will and close messages will be also created
     * @param applicationResources -> is the applicationResources state of the app. Contains mam settings oi4id, health and so on
     * @param mqttSettings
     * @param opcUaBuilder
     * @param clientPayloadHelper
     * @param clientCallbacksHelper
     * @param mqttMessageProcessor
     */
    constructor(applicationResources: IOI4ApplicationResources, mqttSettings: MqttSettings, opcUaBuilder: OPCUABuilder, clientPayloadHelper: ClientPayloadHelper, clientCallbacksHelper: ClientCallbacksHelper, mqttMessageProcessor: MqttMessageProcessor) {
        super();
        this.serviceType = applicationResources.mam.getServiceType();
        this.builder = opcUaBuilder;
        this.applicationResources = applicationResources;
        this.topicPreamble = `oi4/${this.serviceType}/${this.oi4Id}`;

        this.clientPayloadHelper = clientPayloadHelper;

        mqttSettings.will = {
            topic: `oi4/${this.serviceType}/${this.oi4Id}/pub/health/${this.oi4Id}`,
            payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                subResource: this.oi4Id.toString(),
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0),
                DataSetWriterId: CDataSetWriterIdLookup[Resource.HEALTH]
            }], new Date(), DataSetClassIds.health)), /*tslint:disable-line*/
            qos: 0,
            retain: false,
        }

        const publishingLevel: ESyslogEventFilter = process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter | ESyslogEventFilter.warning;
        const logLevel = process.env.OI4_EDGE_LOG_LEVEL ? process.env.OI4_EDGE_LOG_LEVEL as ESyslogEventFilter : publishingLevel;

        initializeLogger(true, mqttSettings.clientId, logLevel, publishingLevel, this.oi4Id, this.serviceType);
        LOGGER.log(`MQTT: Trying to connect with ${mqttSettings.host}:${mqttSettings.port} and client ID: ${mqttSettings.clientId}`);
        this.client = mqtt.connect(mqttSettings);

        updateMqttClient(this.client);
        LOGGER.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.informational);
        this.clientCallbacksHelper = clientCallbacksHelper;
        this.on('setConfig', this.sendEventStatus);
        this.mqttMessageProcessor =  mqttMessageProcessor;

        this.initClientCallbacks();
    }

    get oi4Id() {
        return this.applicationResources.oi4Id;
    }

    private initClientCallbacks() {
        this.client.on(AsyncClientEvents.ERROR, async (err: Error) => this.clientCallbacksHelper.onErrorCallback(err));
        this.client.on(AsyncClientEvents.CLOSE, async () => this.clientCallbacksHelper.onCloseCallback(this));
        this.client.on(AsyncClientEvents.DISCONNECT, async () => this.clientCallbacksHelper.onDisconnectCallback());
        this.client.on(AsyncClientEvents.RECONNECT, async () => this.clientCallbacksHelper.onReconnectCallback());
        this.client.on(AsyncClientEvents.OFFLINE, async () => this.clientCallbacksHelper.onOfflineCallback());
        // Publish Birth Message and start listening to topics
        this.client.on(AsyncClientEvents.CONNECT, async () => this.initClientConnectCallback());
    }

    private async initClientConnectCallback() {
        await this.clientCallbacksHelper.onClientConnectCallback(this);
        await this.initIncomingMessageListeners();
        this.initClientHealthHeartBeat();
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_CHANGED, this.resourceChangedCallback.bind(this));
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_ADDED, this.resourceAddedCallback.bind(this));
    }

    async addSubscription(topic: string, config: SubscriptionListConfig = SubscriptionListConfig.NONE_0, interval = 0) {
        this.applicationResources.subscriptionList.push(SubscriptionList.clone({
            topicPath: topic,
            config: config,
            interval: interval,
        } as SubscriptionList));
        return await this.client.subscribe(topic);
    }

    async removeSubscription(topic: string) {
        return this.client.unsubscribe(topic).then(() => {
            this.applicationResources.subscriptionList = this.applicationResources.subscriptionList.filter(subscription => subscription.topicPath !== topic);
            return true;
        });
    }

    private async initIncomingMessageListeners() {
        // Listen to own routes
        await this.addSubscription(`${this.topicPreamble}/get/#`);
        await this.addSubscription(`${this.topicPreamble}/set/#`);
        await this.addSubscription(`${this.topicPreamble}/del/#`);
        this.client.on(AsyncClientEvents.MESSAGE, async (topic: string, payload: Buffer) => this.mqttMessageProcessor.processMqttMessage(topic, payload, this.builder, this));
    }

    private initClientHealthHeartBeat() {
        setInterval(async () => {
            await this.sendResource(Resource.HEALTH, '', this.oi4Id.toString(), this.oi4Id.toString()).then();
            for(const resource of this.applicationResources.subResources.values()){
                await this.sendResource(Resource.HEALTH, '', resource.oi4Id.toString(), resource.oi4Id.toString()).then();
            }
        }, this.clientHealthHeartbeatInterval); // send all health messages every 60 seconds!
    }

    private resourceChangedCallback(oi4Id: string, resource: Resource) {
        if (resource === Resource.HEALTH) {
            this.sendResource(Resource.HEALTH, '', oi4Id, oi4Id).then();
        }
    }

    private resourceAddedCallback(oi4Id: string) {
        this.sendResource(Resource.MAM, '', oi4Id, oi4Id).then();
    }

    // GET SECTION ----------------//
    /**
     * Sends all available metadata of the applicationResources to the bus
     * @param cutTopic - the cutTopic, containing only the tag-element
     */
    async sendMetaData(cutTopic: string) {
        await this.send(cutTopic, 'metadata', this.applicationResources.metaDataLookup);
    }

    /**
     * Sends all available data of the applicationResources to the bus
     * @param cutTopic - the cuttopic, containing only the tag-element
     */
    public async sendData(cutTopic: string) {
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
     * Send a Master Asset Model to the bus
     * All relevant topic elements are filled from the MAM information
     * @param mam - the MAM to send
     * @param messageId - original messageId used as correlation ID
     */
    async sendMasterAssetModel(mam: MasterAssetModel, messageId?: string) {
        const payload = [this.clientPayloadHelper.createPayload(mam, mam.getOI4Id().toString())];
        await this.sendPayload(payload, Resource.MAM, messageId, 0, 0, mam.getOI4Id().toString());
    }

    /**
     * Sends the saved Resource from applicationResources to the message bus
     * @param resource - the resource that is to be sent to the bus (health, license etc.)
     * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
     * @param subResource
     * @param [filter] - the tag of the resource
     * @param page
     * @param perPage
     */
    async sendResource(resource: Resource, messageId: string, subResource: string, filter: string, page = 0, perPage = 0) {
        const validatedPayload: ValidatedPayload = await this.preparePayload(resource, subResource, filter);

        if (validatedPayload.abortSending) {
            return;
        }

        await this.sendPayload(validatedPayload.payload, resource, messageId, page, perPage, filter);
    }

    async preparePayload(resource: Resource, subResource: string, filter: string): Promise<ValidatedPayload> {
        const validatedFilter: ValidatedFilter = OI4Application.validateFilter(filter);
        if (!validatedFilter.isValid) {
            LOGGER.log('Invalid filter, abort sending...');
            return {payload: undefined, abortSending: true};
        }

        let payloadResult: ValidatedPayload;

        switch (resource) {
            case Resource.MAM:
                payloadResult = this.clientPayloadHelper.createMamResourcePayload(this.applicationResources, subResource);
                break;
            case Resource.RT_LICENSE: { // This is the default case, just send the resource if the tag is ok
                payloadResult = this.clientPayloadHelper.createRTLicenseResourcePayload(this.applicationResources, this.oi4Id);
                break;
            }
            case Resource.PROFILE: {
                payloadResult = this.clientPayloadHelper.createProfileSendResourcePayload(this.applicationResources);
                break;
            }
            case Resource.HEALTH: {
                payloadResult = this.clientPayloadHelper.getHealthPayload(this.applicationResources, Oi4Identifier.fromString(subResource));
                break;
            }
            case Resource.LICENSE_TEXT: {
                payloadResult = this.clientPayloadHelper.createLicenseTextSendResourcePayload(this.applicationResources, filter);
                break;
            }
            case Resource.LICENSE: {
                payloadResult = this.clientPayloadHelper.createLicenseSendResourcePayload(this.applicationResources, subResource, filter);
                break;
            }
            case Resource.PUBLICATION_LIST: {
                // TODO TAG is missing in topic element
                payloadResult = this.clientPayloadHelper.createPublicationListSendResourcePayload(this.applicationResources, Oi4Identifier.fromString(subResource), filter);
                break;
            }
            case Resource.SUBSCRIPTION_LIST: {
                payloadResult = this.clientPayloadHelper.createSubscriptionListSendResourcePayload(this.applicationResources, Oi4Identifier.fromString(subResource), filter);
                break;
            }
            case Resource.CONFIG: {
                payloadResult = this.clientPayloadHelper.createConfigSendResourcePayload(this.applicationResources, subResource, filter);
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

    private static validateFilter(filter: string): ValidatedFilter {
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
                LOGGER.log(`Published ${resource} Pagination: ${nmIdx} of ${networkMessageArray.length} on ${this.topicPreamble}/pub/${resource}${endTag}`, ESyslogEventFilter.informational);
            }
        } catch {
            console.log('Error in building paginated NMA');
        }
    }

    /**
     * Sends an event/event with a specified level to the message bus
     * @param event
     * @param filter
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


    public async sendEventStatus(status: StatusEvent) {
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
            subResource: this.oi4Id.toString(), // With 1.0 subResource is still a string a not a Oi4Identifier and source as with 1.1
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

export class OI4ApplicationBuilder {
    protected applicationResources: IOI4ApplicationResources;
    protected mqttSettings: MqttSettings;
    protected opcUaBuilder: OPCUABuilder;
    protected clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper();
    protected clientCallbacksHelper: ClientCallbacksHelper = new ClientCallbacksHelper();
    protected mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor();

    withApplicationResources(applicationResources: IOI4ApplicationResources) {
        this.applicationResources = applicationResources;
        return this;
    }

    withMqttSettings(mqttSettings: MqttSettings) {
        this.mqttSettings = mqttSettings;
        return this;
    }

    withOPCUABuilder(opcUaBuilder: OPCUABuilder) {
        this.opcUaBuilder = opcUaBuilder;
        return this;
    }

    withClientPayloadHelper(clientPayloadHelper: ClientPayloadHelper) {
        this.clientPayloadHelper = clientPayloadHelper;
        return this;
    }

    withClientCallbacksHelper(clientCallbacksHelper: ClientCallbacksHelper) {
        this.clientCallbacksHelper = clientCallbacksHelper;
        return this;
    }

    withMqttMessageProcessor(mqttMessageProcessor: MqttMessageProcessor) {
        this.mqttMessageProcessor = mqttMessageProcessor;
        return this;
    }

    build() {
        const oi4Id = this.applicationResources.oi4Id;
        const serviceType = this.applicationResources.mam.getServiceType();
        if (this.opcUaBuilder === undefined) {
            this.opcUaBuilder = new OPCUABuilder(oi4Id, serviceType);
        }
        return this.newOI4Application();
    }

    protected newOI4Application() {
        return new OI4Application(this.applicationResources, this.mqttSettings, this.opcUaBuilder, this.clientPayloadHelper, this.clientCallbacksHelper, this.mqttMessageProcessor);
    }
}

