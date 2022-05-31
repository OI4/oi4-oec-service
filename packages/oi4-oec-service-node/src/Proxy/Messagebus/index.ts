import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {IContainerState} from '../../Container/index';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {IOPCUANetworkMessage, IOPCUAPayload} from '@oi4/oi4-oec-service-opcua-model';
import {OI4Proxy} from '../index';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {CDataSetWriterIdLookup} from '@oi4/oi4-oec-service-model';

// DataSetClassIds
import {DataSetClassIds} from '@oi4/oi4-oec-service-model';
import {ISpecificContainerConfig} from '@oi4/oi4-oec-service-model';
import {EDeviceHealth, ESubscriptionListConfig, ESyslogEventFilter} from '@oi4/oi4-oec-service-model';
import {MqttSettings} from './MqttSettings';
import {readFileSync, existsSync} from 'fs';

class OI4MessageBusProxy extends OI4Proxy {
    private readonly client: mqtt.AsyncClient;
    private logger: Logger;

    constructor(container: IContainerState, mqttPreSettings: MqttSettings) {
        super(container);

        // Add Server Object depending on configuration
        const serverObj = {
            host: mqttPreSettings.host,
            port: mqttPreSettings.port,
        };
        console.log(`MQTT: Trying to connect with ${serverObj.host}:${serverObj.port}`);

        // Initialize MQTT Options
        const mqttOpts: MqttSettings = {
            clientId: mqttPreSettings.clientId,
            servers: [serverObj],
            protocol: 'mqtts',
            will: {
                topic: `oi4/${this.serviceType}/${this.oi4Id}/pub/health/${this.oi4Id}`,
                payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{
                    payload: {
                        health: EDeviceHealth.FAILURE_1,
                        healthState: 0,
                    }, dswid: CDataSetWriterIdLookup['health']
                }], new Date(), DataSetClassIds.health)), /*tslint:disable-line*/
                qos: 0,
                retain: false,
            },
        };

        if (!mqttPreSettings.useUnsecureBroker || !this.hasRequiredCertCredentials()) { // This should be the normal case, we connect securely
            mqttOpts.username = mqttPreSettings.username;
            mqttOpts.password = mqttPreSettings.password;
            mqttOpts.protocol = 'mqtts';
            mqttOpts.rejectUnauthorized = false;
        }
        else {
            const ca = readFileSync('/Users/ricardo/Documents/netilion-project/mosquitto/config/certs/ca-root-cert.crt');
            const cert = readFileSync('/Users/ricardo/Documents/netilion-project/testcerts/client.crt');
            const key = readFileSync('/Users/ricardo/Documents/netilion-project/testcerts/client.key');
            const passphrase = existsSync('/Users/ricardo/Documents/netilion-project/testcerts/passphrase.txt') ? readFileSync('/Users/ricardo/Documents/netilion-project/testcerts/passphrase.txt') : undefined;
            mqttOpts.cert = cert;
            mqttOpts.ca = ca;
            mqttOpts.key = key;
            mqttOpts.passphrase = passphrase;
        }

        console.log(`Connecting to MQTT broker with client ID: ${mqttOpts.clientId}`);
        this.client = mqtt.connect(mqttOpts);

        this.logger = new Logger(true, 'Registry-BusProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, this.client, this.oi4Id, this.serviceType);
        this.logger.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.warning);

        this.client.on('error', async (err: Error) => {
            console.log(`Error in mqtt client: ${err}`);
        });
        this.client.on('close', async () => {
            this.containerState.brokerState = false;
            console.log('Connection to mqtt broker closed');
        });
        this.client.on('disconnect', async () => {
            this.containerState.brokerState = false;
            console.log('Disconnected from mqtt broker');
        });
        this.client.on('reconnect', async () => {
            this.containerState.brokerState = false;
            console.log('Reconnecting to mqtt broker');
        })
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
            setInterval(() => {
                this.sendResource('health', '', this.oi4Id);
            }, 60000); // send our own health every 30 seconds!
            this.containerState.on('resourceChanged', this.handleResourceChanged.bind(this));
        });
    }

    private handleResourceChanged(resource: string): void {
        if (resource === 'health') {
            this.sendResource('health', '', this.oi4Id);
        }
    }

    private async ownSubscribe(topic: string):  Promise<mqtt.ISubscriptionGrant[]> {
        this.containerState.subscriptionList.subscriptionList.push({
            topicPath: topic,
            config: ESubscriptionListConfig.NONE_0,
            interval: 0,
        });
        return await this.client.subscribe(topic);
    }

    private hasRequiredCertCredentials(): boolean {
        return existsSync('/Users/ricardo/Documents/netilion-project/mosquitto/config/certs/ca-root-cert.crt') &&
            existsSync('/Users/ricardo/Documents/netilion-project/mosquitto/config/certs/client.crt') &&
            existsSync('/Users/ricardo/Documents/netilion-project/mosquitto/config/certs/client.key')
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

    /**
     * Sends the saved Resource from containerState to the message bus
     * @param resource - the resource that is to be sent to the bus (health, license etc.)
     * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
     * @param [filter] - the tag of the resource
     */
    async sendResource(resource: string, messageId: string, filter: string, page: number = 0, perPage: number = 0) {
        let endTag = '';
        let payload: IOPCUAPayload[] = [];
        let dswidFilter: number = -1; // Initialized with -1, so we know when to use string-based filters or not
        try {
            dswidFilter = parseInt(filter, 10);
            if (dswidFilter === 0) {
                this.logger.log('0 is not a valid DSWID', ESyslogEventFilter.warning);
                return;
            }
        } catch (err) {
            this.logger.log('Error when trying to parse filter as a DSWID, falling back to string-based filters...', ESyslogEventFilter.warning);
            return;
        }

        switch (resource) {
            case 'mam':
            case 'health':
            case 'profile':
            case 'rtLicense': { // This is the default case, just send the resource if the tag is ok
                if (filter === this.oi4Id) {
                    payload = [{payload: this.containerState[resource], dswid: CDataSetWriterIdLookup[resource]}];
                } else {
                    if (Number.isNaN(dswidFilter)) return; // If the filter is not an oi4Id and not a number, we don't know how to handle it
                    if (resource === Object.keys(CDataSetWriterIdLookup)[dswidFilter - 1]) { // Fallback to DSWID based resource
                        payload = [{payload: this.containerState[resource], dswid: CDataSetWriterIdLookup[resource]}];
                        break;
                    }
                    return;
                }
                break;
            }
            case 'licenseText': {
                if (typeof this.containerState.licenseText[filter] === 'undefined') return; // FIXME: Hotfix
                payload = [{
                    payload: {licenseText: this.containerState.licenseText[filter]},
                    dswid: CDataSetWriterIdLookup[resource]
                }]; // licenseText is special...
                break;
            }
            case 'license': {
                if (Number.isNaN(dswidFilter)) { // Try to filter with licenseId
                    if (this.containerState['license'].licenses.some((elem) => elem.licenseId === filter)) { // Does it even make sense to filter?
                        const filteredLicenseArr = this.containerState['license'].licenses.filter((elem) => {
                            if (elem.licenseId === filter) return elem;
                        });
                        for (const filteredLicense of filteredLicenseArr) {
                            payload.push({
                                poi: filteredLicense.licenseId,
                                payload: {
                                    components: filteredLicense.components,
                                },
                                dswid: CDataSetWriterIdLookup['license'],
                            });
                        }
                        break;
                    }
                } else {
                    // We don't need to fill the payloads in the "else" case. Since there's only one DSWID in the license Resource, we send all licenses
                    // Whether there's a DSWID filter, or not we always send all licenses
                    // We only need a check here, if the DSWID even fits. If not, we just abort sending
                    if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
                        this.logger.log(`DSWID does not fit to ${resource} Resource`, ESyslogEventFilter.warning);
                        return;
                    }
                }
                for (const license of this.containerState['license'].licenses) {
                    payload.push({
                        poi: license.licenseId,
                        payload: {
                            components: license.components,
                        },
                        dswid: CDataSetWriterIdLookup[resource],
                    })
                }
                break;
            }
            case 'publicationList': {
                if (Number.isNaN(dswidFilter)) { // Try to filter with resource
                    if (this.containerState['publicationList'].publicationList.some((elem) => elem.resource === filter)) { // Does it even make sense to filter?
                        const filteredPubsArr = this.containerState['publicationList'].publicationList.filter((elem) => {
                            if (elem.resource === filter) return elem;
                        });
                        for (const filteredPubs of filteredPubsArr) {
                            payload.push({
                                poi: filteredPubs.resource,
                                payload: filteredPubs,
                                dswid: CDataSetWriterIdLookup[resource],
                            });
                        }
                        break;
                    }
                } else {
                    // We don't need to fill the payloads in the "else" case. Since there's only one DSWID in the license Resource, we send all licenses
                    // Whether there's a DSWID filter, or not we always send all licenses
                    // We only need a check here, if the DSWID even fits. If not, we just abort sending
                    if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
                        this.logger.log(`DSWID does not fit to ${resource} Resource`, ESyslogEventFilter.warning);
                        return;
                    }
                }
                for (const pubs of this.containerState['publicationList'].publicationList) {
                    payload.push({
                        poi: pubs.resource,
                        payload: pubs,
                        dswid: CDataSetWriterIdLookup[resource],
                    })
                }
                break;
            }
            case 'subscriptionList': {
                if (Number.isNaN(dswidFilter)) { // Try to filter with resource
                    // 7 is resource
                    if (this.containerState['subscriptionList'].subscriptionList.some((elem) => elem.topicPath.split('/')[7] === filter)) { // Does it even make sense to filter?
                        const filteredSubsArr = this.containerState['subscriptionList'].subscriptionList.filter((elem) => {
                            if (elem.topicPath.split('/')[7] === filter) return elem;
                        });
                        for (const filteredSubs of filteredSubsArr) {
                            payload.push({
                                poi: filteredSubs.topicPath.split('/')[7],
                                payload: filteredSubs,
                                dswid: CDataSetWriterIdLookup[resource],
                            });
                        }
                        break;
                    }
                } else {
                    // We don't need to fill the payloads in the "else" case. Since there's only one DSWID in the license Resource, we send all licenses
                    // Whether there's a DSWID filter, or not we always send all licenses
                    // We only need a check here, if the DSWID even fits. If not, we just abort sending
                    if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
                        this.logger.log(`DSWID does not fit to ${resource} Resource`, ESyslogEventFilter.warning);
                        return;
                    }
                }
                for (const subs of this.containerState['subscriptionList'].subscriptionList) {
                    payload.push({ // TODO: poi out of topicPath property
                        poi: subs.topicPath.split('/')[7],
                        payload: subs,
                        dswid: CDataSetWriterIdLookup[resource],
                    })
                }
                break;
            }
            case 'config': {
                if (filter === '') { // Send all configs out
                    const actualPayload: ISpecificContainerConfig = this.containerState[resource];
                    payload.push({
                        poi: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                        payload: actualPayload,
                        dswid: CDataSetWriterIdLookup[resource]
                    });
                } else { // Send only filtered config out
                    const actualPayload: ISpecificContainerConfig = this.containerState[resource];
                    if (filter === actualPayload.context.name.text.toLowerCase().replace(' ', '')) { // Filtered by poi
                        actualPayload[filter] = this.containerState['config'][filter];
                        payload.push({
                            poi: filter,
                            payload: actualPayload,
                            dswid: CDataSetWriterIdLookup[resource]
                        });
                    } else {
                        if (Number.isNaN(dswidFilter)) return; // No poi filter means we can only filter by dswid in this else
                        if (dswidFilter === 8) { // Filtered by dswid
                            const actualPayload: ISpecificContainerConfig = this.containerState[resource];
                            payload.push({
                                poi: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                                payload: actualPayload,
                                dswid: CDataSetWriterIdLookup[resource]
                            });
                            break;
                        }
                        return;
                    }
                }
                break;
            }
            default: {
                this.sendError(`Unknown Resource: ${resource}`);
                return;
            }
        }

        // Don't forget the slash
        if (filter === '') {
            endTag = filter;
        } else {
            endTag = `/${filter}`;
        }

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
