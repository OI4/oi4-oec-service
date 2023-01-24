import mqtt = require('async-mqtt'); /*tslint:disable-line*/
// import {EventEmitter} from 'events';
import {initializeLogger, logger, updateMqttClient} from '@oi4/oi4-oec-service-logger';
// DataSetClassIds
import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    IEvent,
    IOI4ApplicationResources,
    MasterAssetModel, Methods,
    Resources,
    StatusEvent,
    SubscriptionList,
    SubscriptionListConfig,
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    OPCUABuilder,
    ServiceTypes
} from '@oi4/oi4-oec-service-model';
import {ValidatedFilter, ValidatedPayload} from '../topic/TopicModel';
import {ClientPayloadHelper} from '../messaging/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../messaging/ClientCallbacksHelper';
import {AsyncClientEvents} from '../messaging/MessagingModel';
import {MqttMessageProcessor} from '../messaging/MqttMessageProcessor';
import {MqttSettings} from './MqttSettings';
import {OI4ResourceEvent} from './OI4Resource';
import {oi4Namespace} from '../topic/TopicModel';
import {ISubscriptionGrant} from 'mqtt';

export interface IOI4Application {

    readonly oi4Id: Oi4Identifier;
    serviceType: ServiceTypes;
    applicationResources: IOI4ApplicationResources;
    topicPreamble: string;
    builder: OPCUABuilder;
    readonly client: mqtt.AsyncClient;
    readonly clientPayloadHelper: ClientPayloadHelper;

    addSubscription(topic: string, config: SubscriptionListConfig, interval: number): Promise<mqtt.ISubscriptionGrant[]>;

    removeSubscription(topic: string): Promise<boolean>;

    sendResource(resource: Resources, messageId: string, source: string, filter: string, page: number, perPage: number): Promise<void>;

    sendMetaData(cutTopic: string): Promise<void>;

    sendData(oi4Id: Oi4Identifier, data?: any, filter?: string, messageId?: string): Promise<void>;

    sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void>;

    sendEvent(event: IEvent, source: string, filter: string): Promise<void>;

    sendEventStatus(status: StatusEvent, source: string): Promise<void>;

    getConfig(): Promise<void>;
}

export class OI4Application implements IOI4Application {

    public serviceType: ServiceTypes;
    public applicationResources: IOI4ApplicationResources;
    public topicPreamble: string;
    public builder: OPCUABuilder;
    public readonly client: mqtt.AsyncClient;
    public readonly clientPayloadHelper: ClientPayloadHelper;

    private readonly clientHealthHeartbeatInterval: number = 60000;

    private clientCallbacksHelper: ClientCallbacksHelper;
    private readonly mqttMessageProcessor: MqttMessageProcessor;

    static builder(): OI4ApplicationBuilder {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
        //  super();
        this.serviceType = applicationResources.mam.getServiceType();
        this.builder = opcUaBuilder;
        this.applicationResources = applicationResources;
        this.topicPreamble = `${oi4Namespace}/${this.serviceType}/${this.oi4Id}`;

        this.clientPayloadHelper = clientPayloadHelper;

        mqttSettings.will = {
            topic: `${oi4Namespace}/${this.serviceType}/${this.oi4Id}/${Methods.PUB}/${Resources.HEALTH}/${this.oi4Id}`,
            payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                Source: this.oi4Id.toString(),
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0),
                DataSetWriterId: CDataSetWriterIdLookup[Resources.HEALTH]
            }], new Date(), DataSetClassIds.health)), /*tslint:disable-line*/
            qos: 0,
            retain: false,
        }

        const publishingLevel: ESyslogEventFilter = process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter | ESyslogEventFilter.warning;
        const logLevel = process.env.OI4_EDGE_LOG_LEVEL ? process.env.OI4_EDGE_LOG_LEVEL as ESyslogEventFilter : publishingLevel;

        initializeLogger(true, mqttSettings.clientId, logLevel, publishingLevel, this.oi4Id, this.serviceType);
        logger.log(`MQTT: Trying to connect with ${mqttSettings.host}:${mqttSettings.port} and client ID: ${mqttSettings.clientId}`);
        this.client = mqtt.connect(mqttSettings);

        updateMqttClient(this.client);
        logger.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.informational);
        this.clientCallbacksHelper = clientCallbacksHelper;
        // this.on('setConfig', this.sendEventStatus);
        this.mqttMessageProcessor = mqttMessageProcessor;

        this.initClientCallbacks();
    }

    get oi4Id(): Oi4Identifier {
        return this.applicationResources.oi4Id;
    }

    private initClientCallbacks(): void {
        this.client.on(AsyncClientEvents.ERROR, async (err: Error) => this.clientCallbacksHelper.onErrorCallback(err));
        this.client.on(AsyncClientEvents.CLOSE, async () => this.clientCallbacksHelper.onCloseCallback(this));
        this.client.on(AsyncClientEvents.DISCONNECT, async () => this.clientCallbacksHelper.onDisconnectCallback());
        this.client.on(AsyncClientEvents.RECONNECT, async () => this.clientCallbacksHelper.onReconnectCallback());
        this.client.on(AsyncClientEvents.OFFLINE, async () => this.clientCallbacksHelper.onOfflineCallback());
        // Publish Birth Message and start listening to topics
        this.client.on(AsyncClientEvents.CONNECT, async () => this.initClientConnectCallback());
    }

    private async initClientConnectCallback(): Promise<void> {
        await this.clientCallbacksHelper.onClientConnectCallback(this);
        await this.initIncomingMessageListeners();
        this.initClientHealthHeartBeat();
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_CHANGED, this.resourceChangedCallback.bind(this));
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_ADDED, this.resourceAddedCallback.bind(this));
    }

    async addSubscription(topic: string, config: SubscriptionListConfig = SubscriptionListConfig.NONE_0, interval = 0): Promise<ISubscriptionGrant[]> {
        this.applicationResources.subscriptionList = this.applicationResources.subscriptionList.filter(item => item.TopicPath !== topic);
        this.applicationResources.subscriptionList.push(SubscriptionList.clone({
            TopicPath: topic,
            Config: config,
            Interval: interval,
        } as SubscriptionList));
        return await this.client.subscribe(topic);
    }

    async removeSubscription(topic: string): Promise<boolean> {
        return this.client.unsubscribe(topic).then(() => {
            this.applicationResources.subscriptionList = this.applicationResources.subscriptionList.filter(subscription => subscription.TopicPath !== topic);
            return true;
        });
    }

    addListener(event: string | symbol, listener: (...args: never[]) => void): void {
        this.mqttMessageProcessor.addListener(event, listener);
    }

    removeListener(event: string | symbol, listener: (...args: never[]) => void): void {
        this.mqttMessageProcessor.removeListener(event, listener);
    }

    private async initIncomingMessageListeners(): Promise<void> {
        // Listen to own routes
        await this.addSubscription(`${this.topicPreamble}/${Methods.GET}/#`);
        await this.addSubscription(`${this.topicPreamble}/${Methods.SET}/#`);
        await this.addSubscription(`${this.topicPreamble}/${Methods.DEL}/#`);
        this.client.on(AsyncClientEvents.MESSAGE, async (topic: string, payload: Buffer) => this.mqttMessageProcessor.processMqttMessage(topic, payload, this.builder, this));
    }

    private initClientHealthHeartBeat(): void {
        setInterval(async () => {
            await this.sendResource(Resources.HEALTH, '', this.oi4Id.toString(), '').then();
            for (const resource of this.applicationResources.sources.values()) {
                await this.sendResource(Resources.HEALTH, '', resource.oi4Id.toString(), '').then();
            }
        }, this.clientHealthHeartbeatInterval); // send all health messages every 60 seconds!
    }

    private resourceChangedCallback(oi4Id: Oi4Identifier, resource: Resources): void {
        if (resource === Resources.HEALTH) {
            this.sendResource(Resources.HEALTH, '', oi4Id.toString(), '').then();
        }
    }

    private resourceAddedCallback(oi4Id: Oi4Identifier): void {
        this.sendResource(Resources.MAM, '', oi4Id.toString(), '').then();
    }

    // GET SECTION ----------------//
    /**
     * Sends all available metadata of the applicationResources to the bus
     * @param cutTopic - the cutTopic, containing only the tag-element
     */
    async sendMetaData(cutTopic: string): Promise<void> {
        await this.send(cutTopic, Resources.METADATA, this.applicationResources.metaDataLookup);
    }

    //FIXME add a better type for the information send (Either data or metadata)
    private async send(tagName: string, type: string, information: any): Promise<void> {
        if (tagName === '') { // If there is no tag specified, we should send all available metadata
            await this.client.publish(`${this.topicPreamble}/${Methods.PUB}/${type}`, JSON.stringify(information));
            logger.log(`Published ALL available ${type.toUpperCase()} on ${this.topicPreamble}/${Methods.PUB}/${type}`);
            return;
        }
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (tagName in dataLookup) {
            await this.client.publish(`${this.topicPreamble}/${Methods.PUB}/${type}/${tagName}`, JSON.stringify(information[tagName]));
            logger.log(`Published available ${type.toUpperCase()} on ${this.topicPreamble}/${Methods.PUB}/${type}/${tagName}`);
        }
    }

    /**
     * Send a Master Asset Model to the bus
     * All relevant topic elements are filled from the MAM information
     * @param mam - the MAM to send
     * @param messageId - original messageId used as correlation ID
     */
    async sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void> {
        const payload = [this.clientPayloadHelper.createPayload(mam, mam.getOI4Id().toString())];
        await this.sendPayload(payload, Resources.MAM, messageId, 0, 0, mam.getOI4Id().toString());
    }

    /**
     * Send the according payload as resource data to the bus or uses the given data from the application resource
     * @param oi4Id - the oi4Id of the resource
     * @param data - the data to send
     * @param filter - the filter to use
     * @param messageId - original messageId used as correlation ID
     */
    async sendData(oi4Id: Oi4Identifier, data?: any, filter?: string, messageId?: string): Promise<void> {
        if (data === undefined) {
            // TODO is is most likely not right
            data = this.applicationResources.dataLookup[oi4Id.toString()];
        }
        const payload = [this.clientPayloadHelper.createPayload(data, oi4Id.toString())];
        await this.sendPayload(payload, Resources.DATA, messageId, 0, 0, oi4Id.toString(), filter);
    }

    /**
     * Sends the saved Resource from applicationResources to the message bus
     * @param resource - the resource that is to be sent to the bus (health, license etc.)
     * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
     * @param source
     * @param [filter] - the tag of the resource
     * @param page
     * @param perPage
     */
    async sendResource(resource: Resources, messageId: string, source: string, filter: string, page = 0, perPage = 0): Promise<void> {
        const validatedPayload: ValidatedPayload = await this.preparePayload(resource, source, filter);

        if (validatedPayload === undefined || validatedPayload.abortSending) {
            return;
        }

        await this.sendPayload(validatedPayload.payload, resource, messageId, page, perPage, source, filter);
    }

    async preparePayload(resource: Resources, source: string, filter?: string): Promise<ValidatedPayload> {
        const validatedFilter: ValidatedFilter = OI4Application.validateFilter(filter);
        if (!validatedFilter.isValid) {
            logger.log('Invalid filter, abort sending...');
            return {payload: undefined, abortSending: true};
        }

        let payloadResult: ValidatedPayload;

        switch (resource) {
            case Resources.MAM:
                payloadResult = this.clientPayloadHelper.createMamResourcePayload(this.applicationResources, this.oi4Id, source);
                break;
            case Resources.RT_LICENSE: { // This is the default case, just send the resource if the tag is ok
                payloadResult = this.clientPayloadHelper.createRTLicenseResourcePayload(this.applicationResources, this.oi4Id);
                break;
            }
            case Resources.PROFILE: {
                payloadResult = this.clientPayloadHelper.createProfileSendResourcePayload(this.applicationResources);
                break;
            }
            case Resources.HEALTH: {
                payloadResult = this.clientPayloadHelper.getHealthPayload(this.applicationResources, Oi4Identifier.fromString(source));
                break;
            }
            case Resources.LICENSE_TEXT: {
                payloadResult = this.clientPayloadHelper.createLicenseTextSendResourcePayload(this.applicationResources, filter);
                break;
            }
            case Resources.LICENSE: {
                payloadResult = this.clientPayloadHelper.createLicenseSendResourcePayload(this.applicationResources, source, filter);
                break;
            }
            case Resources.PUBLICATION_LIST: {
                // TODO TAG is missing in topic element
                payloadResult = this.clientPayloadHelper.createPublicationListSendResourcePayload(this.applicationResources, Oi4Identifier.fromString(source), filter);
                break;
            }
            case Resources.SUBSCRIPTION_LIST: {
                payloadResult = this.clientPayloadHelper.createSubscriptionListSendResourcePayload(this.applicationResources, Oi4Identifier.fromString(source), filter);
                break;
            }
            case Resources.CONFIG: {
                payloadResult = this.clientPayloadHelper.createConfigSendResourcePayload(this.applicationResources, Oi4Identifier.fromString(source), filter);
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
    async sendError(error: string): Promise<void> {
        logger.log(`Error: ${error}`, ESyslogEventFilter.error);
    }

    private static validateFilter(filter?: string): ValidatedFilter {
        // Initialized with -1, so we know when to use string-based filters or not
        let dswidFilter = -1;
        try {
            dswidFilter = parseInt(filter, 10);
            if (dswidFilter === 0) {
                logger.log('0 is not a valid DSWID', ESyslogEventFilter.warning);
                return {isValid: false, dswidFilter: undefined};
            }
        } catch (err) {
            logger.log('Error when trying to parse filter as a DSWID, falling back to string-based filters...', ESyslogEventFilter.warning);
            return {isValid: false, dswidFilter: undefined};
        }

        return {isValid: true, dswidFilter: dswidFilter};
    }

    private async sendPayload(payload: IOPCUADataSetMessage[], resource: string, messageId: string, page: number, perPage: number, source: string, filter?: string): Promise<void> {
        // Don't forget the slash
        let endTag = '';
        if (source && source.length > 0) {
            endTag = `/${source}`;
        }
        if (filter && filter.length > 0 && endTag.length > 0) {
            endTag = `/${source}/${filter}`;
        }

        try {
            const networkMessageArray: IOPCUANetworkMessage[] = this.builder.buildPaginatedOPCUANetworkMessageArray(payload, new Date(), DataSetClassIds[resource], messageId, page, perPage);
            if (typeof networkMessageArray[0] === 'undefined') {
                logger.log('Error in paginated NetworkMessage creation, most likely a page was requested which is out of range', ESyslogEventFilter.warning);
            }
            for (const [nmIdx, networkMessages] of networkMessageArray.entries()) {
                await this.client.publish(
                    `${this.topicPreamble}/${Methods.PUB}/${resource}${endTag}`,
                    JSON.stringify(networkMessages));
                logger.log(`Published ${resource} Pagination: ${nmIdx} of ${networkMessageArray.length} on ${this.topicPreamble}/${Methods.PUB}/${resource}${endTag}`, ESyslogEventFilter.informational);
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
    async sendEvent(event: IEvent, source: string, filter: string) {
        const payload: IOPCUADataSetMessage[] = this.clientPayloadHelper.createPublishEventMessage(filter, source, event);

        const opcUAEvent = this.builder.buildOPCUANetworkMessage(payload, new Date(), DataSetClassIds.event);
        const publishAddress = `${this.topicPreamble}/${Methods.PUB}/${Resources.EVENT}/${source}/${filter}`;
        await this.client.publish(publishAddress, JSON.stringify(opcUAEvent));
        logger.log(`Published event on ${this.topicPreamble}/${Resources.EVENT}/${source}/${filter}`);
    }


    public async sendEventStatus(status: StatusEvent, source: string) {
        const opcUAStatus = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            Source: source,
            Payload: status,
            DataSetWriterId: CDataSetWriterIdLookup[Resources.EVENT],
        }], new Date(), DataSetClassIds.event); /*tslint:disable-line*/
        await this.client.publish(`${this.topicPreamble}/${Methods.PUB}/${Resources.EVENT}/Status/${encodeURI(this.builder.publisherId)}`, JSON.stringify(opcUAStatus));
    }

    async getConfig() {
        const opcUAEvent = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            Source: this.oi4Id.toString(), // With 1.0 subResource is still a string a not a Oi4Identifier and source as with 1.1
            Payload: this.applicationResources.config,
            DataSetWriterId: CDataSetWriterIdLookup[Resources.CONFIG],
        }], new Date(), DataSetClassIds.event); /*tslint:disable-line*/
        await this.client.publish(`${this.topicPreamble}/${Methods.GET}/${Resources.CONFIG}/${this.oi4Id}`, JSON.stringify(opcUAEvent));
        logger.log(`Published get config on ${this.topicPreamble}/${Methods.GET}/${Resources.CONFIG}/${this.oi4Id}`);
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

    withApplicationResources(applicationResources: IOI4ApplicationResources): OI4ApplicationBuilder {
        this.applicationResources = applicationResources;
        return this;
    }

    withMqttSettings(mqttSettings: MqttSettings): OI4ApplicationBuilder {
        this.mqttSettings = mqttSettings;
        return this;
    }

    withOPCUABuilder(opcUaBuilder: OPCUABuilder): OI4ApplicationBuilder {
        this.opcUaBuilder = opcUaBuilder;
        return this;
    }

    withClientPayloadHelper(clientPayloadHelper: ClientPayloadHelper): OI4ApplicationBuilder {
        this.clientPayloadHelper = clientPayloadHelper;
        return this;
    }

    withClientCallbacksHelper(clientCallbacksHelper: ClientCallbacksHelper): OI4ApplicationBuilder {
        this.clientCallbacksHelper = clientCallbacksHelper;
        return this;
    }

    withMqttMessageProcessor(mqttMessageProcessor: MqttMessageProcessor): OI4ApplicationBuilder {
        this.mqttMessageProcessor = mqttMessageProcessor;
        return this;
    }

    build(): IOI4Application {
        const oi4Id = this.applicationResources.oi4Id;
        const serviceType = this.applicationResources.mam.getServiceType();
        if (this.opcUaBuilder === undefined) {
            const maximumPackageSize: number = this.mqttSettings?.properties?.maximumPacketSize | 262144;
            this.opcUaBuilder = new OPCUABuilder(oi4Id, serviceType, maximumPackageSize);
        }
        return this.newOI4Application();
    }

    protected newOI4Application(): IOI4Application {
        return new OI4Application(this.applicationResources, this.mqttSettings, this.opcUaBuilder, this.clientPayloadHelper, this.clientCallbacksHelper, this.mqttMessageProcessor);
    }
}
