import mqtt = require('async-mqtt'); /*tslint:disable-line*/
// import {EventEmitter} from 'events';
import {initializeLogger, logger, updateMqttClient} from '@oi4/oi4-oec-service-logger';
// DataSetClassIds
import {
    DataSetClassIds,
    DataSetWriterIdManager,
    EDeviceHealth,
    ESyslogEventFilter,
    getDataSetClassId,
    IEvent,
    IOI4ApplicationResources,
    IOPCUADataSetMessage,
    IOPCUADataSetMetaData,
    IOPCUANetworkMessage,
    MasterAssetModel,
    Methods,
    Oi4Identifier,
    OI4ResourceEvent,
    OPCUABuilder,
    Resources,
    ServiceTypes,
    StatusEvent,
    SubscriptionList,
    SubscriptionListConfig
} from '@oi4/oi4-oec-service-model';
import {oi4Namespace, TopicInfo, ValidatedFilter, ValidatedPayload} from '../topic/TopicModel';
import {ClientPayloadHelper} from '../messaging/ClientPayloadHelper';
import {ClientCallbacksHelper, IClientCallbacksHelper} from '../messaging/ClientCallbacksHelper';
import {IMqttMessageProcessor, MqttMessageProcessor} from '../messaging/MqttMessageProcessor';
import {MqttSettings} from './MqttSettings';
import {ISubscriptionGrant} from 'mqtt';
import {IOI4MessageBus, OI4MessageBus} from '../messaging/OI4MessageBus';

export interface IOI4Application {

    readonly oi4Id: Oi4Identifier;
    serviceType: ServiceTypes;
    applicationResources: IOI4ApplicationResources;
    topicPreamble: string;
    builder: OPCUABuilder;
    readonly messageBus: IOI4MessageBus;
    readonly clientPayloadHelper: ClientPayloadHelper;

    readonly mqttMessageProcessor: IMqttMessageProcessor;

    addSubscription(topic: string, config: SubscriptionListConfig, interval: number): Promise<mqtt.ISubscriptionGrant[]>;

    removeSubscription(topic: string): Promise<boolean>;

    sendResource(resource: Resources, messageId: string, source: Oi4Identifier, filter: string, page: number, perPage: number): Promise<void>;

    sendMetaData(cutTopic: string): Promise<void>;

    sendData(oi4Id: Oi4Identifier, data?: any, filter?: string, messageId?: string): Promise<void>;

    sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void>;

    sendEvent(event: IEvent, source: Oi4Identifier, filter: string): Promise<void>;

    sendEventStatus(status: StatusEvent, source: Oi4Identifier): Promise<void>;

    getConfig(): Promise<void>;

    addListener(event: string | symbol, listener: (...args: never[]) => void): void;

    removeListener(event: string | symbol, listener: (...args: never[]) => void): void;

    preparePayload(resource: Resources, source: Oi4Identifier, filter?: string): Promise<ValidatedPayload>;

    requestMAM(topicInfo: TopicInfo): Promise<void>;

    sendSetResource(topicInfo: TopicInfo, resource: any): Promise<void>;
}

export class OI4Application implements IOI4Application {

    public serviceType: ServiceTypes;
    public applicationResources: IOI4ApplicationResources;
    public topicPreamble: string;
    public builder: OPCUABuilder;
    public readonly messageBus: IOI4MessageBus;
    public readonly clientPayloadHelper: ClientPayloadHelper;
    readonly mqttMessageProcessor: IMqttMessageProcessor;

    private readonly clientHealthHeartbeatInterval: number = 60000;

    private readonly clientCallbacksHelper: ClientCallbacksHelper;

    private readonly initClientConnectCallback = async (): Promise<void> => {
        await this.clientCallbacksHelper.onClientConnectCallback(this);
        await this.initIncomingMessageListeners();
        this.initClientHealthHeartBeat();
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_CHANGED, this.resourceChangedCallback.bind(this));
        this.applicationResources.on(OI4ResourceEvent.RESOURCE_ADDED, this.resourceAddedCallback.bind(this));
    }

    static builder(): OI4ApplicationBuilder {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new OI4ApplicationBuilder();
    };

    /***
     * The constructor initializes the mqtt settings and establish a conection and listeners
     * In Addition birth, will and close messages will be also created
     * @param applicationResources -> is the applicationResources state of the app. Contains mam settings oi4id, health and so on
     * @param messageBus
     * @param mqttSettings
     * @param opcUaBuilder
     * @param clientPayloadHelper
     * @param clientCallbacksHelper
     * @param mqttMessageProcessor
     */
    constructor(applicationResources: IOI4ApplicationResources, messageBus: IOI4MessageBus, mqttSettings: MqttSettings, opcUaBuilder: OPCUABuilder, clientPayloadHelper: ClientPayloadHelper, clientCallbacksHelper: IClientCallbacksHelper, mqttMessageProcessor: IMqttMessageProcessor) {
        //  super();
        this.serviceType = applicationResources.mam.getServiceType();
        this.builder = opcUaBuilder;
        this.applicationResources = applicationResources;
        this.topicPreamble = `${oi4Namespace}/${this.serviceType}/${this.oi4Id.toString()}`;

        this.clientPayloadHelper = clientPayloadHelper;

        mqttSettings.will = {
            topic: `${oi4Namespace}/${this.serviceType}/${this.oi4Id}/${Methods.PUB}/${Resources.HEALTH}/${this.oi4Id.toString()}`,
            payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                Source: this.oi4Id,
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0),
                DataSetWriterId: 0,
            }], new Date(), DataSetClassIds.Health)), /*tslint:disable-line*/
            qos: 0,
            retain: false,
        }

        const publishingLevel: ESyslogEventFilter = process.env.OI4_EDGE_EVENT_LEVEL ? process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter : ESyslogEventFilter.warning;
        const logLevel = process.env.OI4_EDGE_LOG_LEVEL ? process.env.OI4_EDGE_LOG_LEVEL as ESyslogEventFilter : publishingLevel;

        initializeLogger(true, mqttSettings.clientId, logLevel, publishingLevel, this.oi4Id, this.serviceType);
        logger.log(`MQTT: Trying to connect with ${mqttSettings.host}:${mqttSettings.port} and client ID: ${mqttSettings.clientId}`);
        this.messageBus = messageBus;
        this.messageBus.connect(mqttSettings, this);

        updateMqttClient(this.messageBus.getClient());
        logger.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.informational);
        this.clientCallbacksHelper = clientCallbacksHelper;

        this.mqttMessageProcessor = mqttMessageProcessor;

        this.messageBus.initClientCallbacks(this.clientCallbacksHelper, this, this.initClientConnectCallback);
    }

    get oi4Id(): Oi4Identifier {
        return this.applicationResources.oi4Id;
    }

    // private async initClientConnectCallback(): Promise<void> {
    //     await this.clientCallbacksHelper.onClientConnectCallback(this);
    //     await this.initIncomingMessageListeners();
    //     this.initClientHealthHeartBeat();
    //     this.applicationResources.on(OI4ResourceEvent.RESOURCE_CHANGED, this.resourceChangedCallback.bind(this));
    //     this.applicationResources.on(OI4ResourceEvent.RESOURCE_ADDED, this.resourceAddedCallback.bind(this));
    // }

    async addSubscription(topic: string, config: SubscriptionListConfig = SubscriptionListConfig.NONE_0, interval = 0): Promise<ISubscriptionGrant[]> {
        this.applicationResources.subscriptionList = this.applicationResources.subscriptionList.filter((item: {
            TopicPath: string;
        }) => item.TopicPath !== topic);
        this.applicationResources.subscriptionList.push(SubscriptionList.clone({
            TopicPath: topic,
            Config: config,
            Interval: interval,
        } as SubscriptionList));
        return await this.messageBus.subscribe(topic);
    }

    async removeSubscription(topic: string): Promise<boolean> {
        return this.messageBus.unsubscribe(topic).then(() => {
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
    }

    private initClientHealthHeartBeat(): void {
        setInterval(async () => {
            await this.sendResource(Resources.HEALTH, '', this.oi4Id, '').then();
            for (const resource of this.applicationResources.sources.values()) {
                await this.sendResource(Resources.HEALTH, '', resource.oi4Id, '').then();
            }
        }, this.clientHealthHeartbeatInterval); // send all health messages every 60 seconds!
    }

    private resourceChangedCallback(oi4Id: Oi4Identifier, resource: Resources): void {
        logger.log(`Resource changed called for: ${resource} - ${oi4Id.toString()}`, ESyslogEventFilter.informational);
        this.sendResource(resource, '', oi4Id, '').then();
    }

    private resourceAddedCallback(oi4Id: Oi4Identifier, resource = Resources.MAM): void {
        logger.log(`Resource added called for: ${resource} - ${oi4Id.toString()}`, ESyslogEventFilter.informational);
        this.sendResource(resource, '', oi4Id, '').then();
    }

    // GET SECTION ----------------//
    /**
     * Sends all available metadata of the applicationResources to the bus
     * @param cutTopic - the cutTopic, containing only the tag-element
     */
    async sendMetaData(tagName: string): Promise<void> {
        // TODO create proper IOPCUADataSetMetaData
        //const information = this.applicationResources.metaDataLookup;
        const metaData = {} as IOPCUADataSetMetaData;
        if (tagName === '') { // If there is no tag specified, we should send all available metadata
            await this.messageBus.publishMetaData(`${this.topicPreamble}/${Methods.PUB}/${Resources.METADATA}`, metaData);
            logger.log(`Published ALL available ${Resources.METADATA} on ${this.topicPreamble}/${Methods.PUB}/${Resources.METADATA}`);
            return;
        }
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (tagName in dataLookup) {
            // JSON.stringify(information[tagName])
            await this.messageBus.publishMetaData(`${this.topicPreamble}/${Methods.PUB}/${Resources.METADATA}/${tagName}`, metaData);
            logger.log(`Published available ${Resources.METADATA} on ${this.topicPreamble}/${Methods.PUB}/${Resources.METADATA}/${tagName}`);
        }
    }

    /**
     * Send a Master Asset Model to the bus
     * All relevant topic elements are filled from the MAM information
     * @param mam - the MAM to send
     * @param messageId - original messageId used as correlation ID
     */
    async sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void> {
        const payload = [this.clientPayloadHelper.createPayload(mam, mam.getOI4Id())];
        await this.sendPayload(payload, Resources.MAM, messageId, 0, 0, mam.getOI4Id());
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
        const payload = [this.clientPayloadHelper.createPayload(data, oi4Id)];
        await this.sendPayload(payload, Resources.DATA, messageId, 0, 0, oi4Id, filter);
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
    async sendResource(resource: Resources, messageId: string, source: Oi4Identifier, filter: string, page = 0, perPage = 0): Promise<void> {
        const validatedPayload: ValidatedPayload = await this.preparePayload(resource, source, filter);

        if (validatedPayload === undefined || validatedPayload.abortSending) {
            return;
        }

        await this.sendPayload(validatedPayload.payload, resource, messageId, page, perPage, source, filter);
    }

    async preparePayload(resource: Resources, source: Oi4Identifier, filter?: string): Promise<ValidatedPayload> {
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
                payloadResult = this.clientPayloadHelper.getHealthPayload(this.applicationResources, source);
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
                payloadResult = this.clientPayloadHelper.createPublicationListSendResourcePayload(this.applicationResources, source, filter);
                break;
            }
            case Resources.SUBSCRIPTION_LIST: {
                payloadResult = this.clientPayloadHelper.createSubscriptionListSendResourcePayload(this.applicationResources, source, filter);
                break;
            }
            case Resources.CONFIG: {
                payloadResult = this.clientPayloadHelper.createConfigSendResourcePayload(this.applicationResources, source, filter);
                break;
            }
            case Resources.REFERENCE_DESIGNATION: {
                payloadResult = this.clientPayloadHelper.getReferenceDesignationPayload(this.applicationResources, source);
                break;
            }
            default: {
                await this.sendError(`Unknown Resource: ${resource}`);
                return;
            }
        }

        return payloadResult;
    }

    public async requestMAM(topicInfo: TopicInfo): Promise<void> {

        const networkMessage = this.builder.buildOPCUANetworkMessage([], new Date(), DataSetClassIds.MAM, this.builder.getMessageId());

        const topic = (method: Methods): string => `${oi4Namespace}/${topicInfo.serviceType}/${topicInfo.appId.toString()}/${method}/${Resources.MAM}/${topicInfo.source.toString()}`;
        //const baseTopic = `${oi4Namespace}/${topicInfo.serviceType}/${topicInfo.appId.toString()}`;
        //const topic = `${baseTopic}/${Methods.PUB}/${Resources.MAM}/${topicInfo.source.toString()}`;
        // Check if MAM has been requested already
        const pubTopic = topic(Methods.PUB);
        if (!this.mqttMessageProcess.hasMAMRequest(pubTopic)) {
            // Check if MAM is part of the regular subscriptions...
            const subscribed = !!this.applicationResources.subscriptionList.find(subscription => subscription.TopicPath == pubTopic);
            this.mqttMessageProcess.addRequestedMAM(pubTopic, subscribed);
            // ...and if not subscribe
            if (!subscribed) {
                const grants = await this.messageBus.subscribe(pubTopic);
                logger.log(`Subscribed to ${topic} with ${grants.length}`, ESyslogEventFilter.debug);
            }
            // Send request
            const getTopic = topic(Methods.GET);
            await this.messageBus.publish(getTopic, networkMessage);
            logger.log(`Published MAM request to app: ${topicInfo.appId} for resource: ${topicInfo.source}`, ESyslogEventFilter.informational);
        } else {
            logger.log(`MAM for app ${topicInfo.appId} and resource: ${topicInfo.source} already requested.`, ESyslogEventFilter.debug);
        }

    }

    public async sendSetResource(topicInfo: TopicInfo, payload: any): Promise<void> {
        const dsp: IOPCUADataSetMessage = {
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(topicInfo.resource, topicInfo.source),
            Filter: topicInfo.filter,
            Payload: payload,
            SequenceNumber: 0,
            Source: topicInfo.source,
        };
        const networkMessage = this.builder.buildOPCUANetworkMessage([dsp], new Date(), getDataSetClassId(topicInfo.resource), this.builder.getMessageId());
        const filter = topicInfo.filter !== undefined ? `/${topicInfo.filter}` : '';
        const topic = `${oi4Namespace}/${topicInfo.serviceType}/${topicInfo.appId.toString()}/${Methods.SET}/${topicInfo.resource}/${topicInfo.source.toString()}${filter}`;
        await this.messageBus.publish(topic, networkMessage);
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

    private async sendPayload(payload: IOPCUADataSetMessage[], resource: string, messageId: string, page: number, perPage: number, source: Oi4Identifier, filter?: string): Promise<void> {
        // Don't forget the slash
        let endTag = '';
        if (source !== undefined) {
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
                await this.messageBus.publish(
                    `${this.topicPreamble}/${Methods.PUB}/${resource}${endTag}`,
                    networkMessages);
                logger.log(`Published ${resource} Pagination: ${nmIdx} of ${networkMessageArray.length} on ${this.topicPreamble}/${Methods.PUB}/${resource}${endTag}`, ESyslogEventFilter.informational);
            }
        } catch (error) {
            logger.log(`Error in building paginated NMA:  ${error}`, ESyslogEventFilter.informational);
        }
    }

    /**
     * Sends an event/event with a specified level to the message bus
     * @param event
     * @param filter
     */
    // TODO figure out how the determine the filter from the actual object/interface, whatever
    async sendEvent(event: IEvent, source: Oi4Identifier, filter: string): Promise<void> {
        const payload: IOPCUADataSetMessage[] = this.clientPayloadHelper.createPublishEventMessage(filter, source, event);

        const networkMessage = this.builder.buildOPCUANetworkMessage(payload, new Date(), DataSetClassIds.Event);
        const publishAddress = `${this.topicPreamble}/${Methods.PUB}/${Resources.EVENT}/${source}/${filter}`;
        await this.messageBus.publish(publishAddress, networkMessage);
        logger.log(`Published event on ${this.topicPreamble}/${Resources.EVENT}/${source}/${filter}`);
    }


    public async sendEventStatus(status: StatusEvent, source: Oi4Identifier): Promise<void> {
        const networkMessage = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            Source: source,
            Payload: status,
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, source),
        }], new Date(), DataSetClassIds.Event); /*tslint:disable-line*/
        await this.messageBus.publish(`${this.topicPreamble}/${Methods.PUB}/${Resources.EVENT}/Status/${encodeURI(this.builder.publisherId)}`, networkMessage);
    }

    async getConfig(): Promise<void> {
        const networkMessage = this.builder.buildOPCUANetworkMessage([{
            SequenceNumber: 1,
            Source: this.oi4Id,
            Payload: this.applicationResources.config,
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.CONFIG, this.oi4Id),
        }], new Date(), DataSetClassIds.Event); /*tslint:disable-line*/
        await this.messageBus.publish(`${this.topicPreamble}/${Methods.GET}/${Resources.CONFIG}/${this.oi4Id}`, networkMessage);
        logger.log(`Published get config on ${this.topicPreamble}/${Methods.GET}/${Resources.CONFIG}/${this.oi4Id}`);
    }

    /**
     * Makes the MQTT Client available to be used by other applications
     */
    get oi4MessageBus(): IOI4MessageBus {
        return this.messageBus;
    }

    get mqttMessageProcess(): IMqttMessageProcessor {
        return this.mqttMessageProcessor;
    }
}

export class OI4ApplicationBuilder {
    protected applicationResources: IOI4ApplicationResources;
    protected mqttSettings: MqttSettings;
    protected messageBus: IOI4MessageBus;
    protected opcUaBuilder: OPCUABuilder;
    protected clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper();
    protected clientCallbacksHelper: IClientCallbacksHelper = new ClientCallbacksHelper();
    protected mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor();

    withApplicationResources(applicationResources: IOI4ApplicationResources): OI4ApplicationBuilder {
        this.applicationResources = applicationResources;
        return this;
    }

    withMqttSettings(mqttSettings: MqttSettings): OI4ApplicationBuilder {
        this.mqttSettings = mqttSettings;
        return this;
    }

    withMessageBus(messageBus: IOI4MessageBus): OI4ApplicationBuilder {
        this.messageBus = messageBus;
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

    withClientCallbacksHelper(clientCallbacksHelper: IClientCallbacksHelper): OI4ApplicationBuilder {
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
        if (this.messageBus === undefined) {
            this.messageBus = new OI4MessageBus()
        }
        return this.newOI4Application();
    }

    protected newOI4Application(): IOI4Application {
        return new OI4Application(this.applicationResources, this.messageBus, this.mqttSettings, this.opcUaBuilder, this.clientPayloadHelper, this.clientCallbacksHelper, this.mqttMessageProcessor);
    }
}
