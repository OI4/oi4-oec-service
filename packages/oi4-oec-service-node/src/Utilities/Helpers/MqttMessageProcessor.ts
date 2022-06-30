import {
    DataSetClassIds,
    ESyslogEventFilter,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IOI4ApplicationResources,
    StatusEvent
} from '@oi4/oi4-oec-service-model';
import {EOPCUAStatusCode, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {TopicInfo, ValidatedIncomingMessageData, ValidatedMessage} from './Types';
import {PayloadTypes, ResourceType, TopicMethods} from './Enums';
import {OI4RegistryManager} from '../../application/OI4RegistryManager';
import EventEmitter from 'events';

export class MqttMessageProcessor {
    private readonly sendMetaData: Function;
    private readonly sendResource: Function;
    private readonly METADATA = 'metadata';
    private readonly emitter: EventEmitter;
    private readonly DATA = 'data';

    private applicationResources: IOI4ApplicationResources;

    constructor(applicationResources: IOI4ApplicationResources, sendMetaData: Function, sendResource: Function, emitter: EventEmitter) {
        this.applicationResources = applicationResources;
        this.sendMetaData = sendMetaData;
        this.sendResource = sendResource;
        this.emitter = emitter;
    }

    /**
     * Processes the incoming mqtt message by parsing the different elements of the topic and reacting to it
     * @param topic - the incoming topic from the messagebus
     * @param message - the entire binary message from the messagebus
     * @param builder
     */
    public processMqttMessage = async (topic: string, message: Buffer, builder: OPCUABuilder) => {
        const validatedData: ValidatedIncomingMessageData = this.validateData(topic, message, builder);
        if(!validatedData.areValid) {
            return;
        }

        await this.processMessage(validatedData.topicInfo, validatedData.parsedMessage, builder);
    }

    private validateData(topic: string, message: Buffer, builder: OPCUABuilder): ValidatedIncomingMessageData {

        const validateMessage: ValidatedMessage = this.validateIncomingMessage(message);
        if(!validateMessage.isValid) {
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
        } else if (validateMessage.parsedMessage.Messages.length === 0) {
            LOGGER.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.informational);
        }

        if(topic.indexOf(`/${TopicMethods.PUB}/`) != -1) {
            LOGGER.log(`No reaction needed to our own publication messages${topic.substring(topic.indexOf(`/${TopicMethods.PUB}/`), topic.length)}`);
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
        }

        const schemaResult = this.getSchemaResult(builder, validateMessage.parsedMessage);
        if(!this.areSchemaResultAndBuildValid(schemaResult, builder, topic)){
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};;
        }

        // Split the topic into its different elements
        const topicInfo: TopicInfo = this.extractTopicInfo(topic);

        // Safety-Check: DataSetClassId
        if (validateMessage.parsedMessage.DataSetClassId !== DataSetClassIds[topicInfo.resource]) {
            LOGGER.log(`Error in pre-check, dataSetClassId mismatch, got ${validateMessage.parsedMessage.DataSetClassId}, expected ${DataSetClassIds[topicInfo.resource]}`, ESyslogEventFilter.warning);
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};;
        }

        return {areValid: true, parsedMessage: validateMessage.parsedMessage, topicInfo: topicInfo};
    }

    private validateIncomingMessage(message: Buffer): ValidatedMessage {
        // Convert message to JSON, TODO: if this fails, an error is written in the logger
        try {
            return {isValid: true, parsedMessage: JSON.parse(message.toString())};
        } catch (e) {
            LOGGER.log(`Error when parsing JSON in processMqttMessage: ${e}`, ESyslogEventFilter.warning);
        }
        return {isValid: false, parsedMessage: undefined};
    }

    private async getSchemaResult(builder: OPCUABuilder, parsedMessage: IOPCUANetworkMessage): Promise<boolean> {
        try {
            return await builder.checkOPCUAJSONValidity(parsedMessage);
        } catch (e) {
            LOGGER.log(`OPC UA validation failed with: ${typeof e === 'string' ? e : JSON.stringify(e)}`, ESyslogEventFilter.warning);
            return undefined;
        }
    }

    private areSchemaResultAndBuildValid(schemaResult: Promise<boolean>, builder: OPCUABuilder, topic: string): boolean {
        if (!schemaResult) {
            LOGGER.log('Error in pre-check (crash-safety) schema validation, please run asset through conformity validation or increase logLevel', ESyslogEventFilter.warning);
            return false;
        }

        if (!builder.checkTopicPath(topic)) {
            LOGGER.log('Error in pre-check topic Path, please correct topic Path', ESyslogEventFilter.warning);
            return false;
        }

        return true;
    }

    private extractTopicInfo(topic: string): TopicInfo {

        /**
        Accordingly to the guideline, these are the possible generic requests
                - oi4/<serviceType>/<appId>/get/mam/<oi4Identifier>
                - oi4/<serviceType>/<appId>/get/health/<oi4Identifier>
                - oi4/<serviceType>/<appId>/get/rtLicense/<oi4Identifier>
                - oi4/<serviceType>/<appId>/get/profile/<oi4Identifier>
                - oi4/<serviceType>/<appId>/get/referenceDesignation/<oi4Identifier>
                - oi4/<serviceType>/<appId>/{get/set/del}/referenceDesignation/<oi4Identifier>
                ---
                - oi4/<serviceType>/<appId>/get/config/<oi4Identifier>/<filter>
                - oi4/<serviceType>/<appId>/set/config/<oi4Identifier>/<filter>
                - oi4/<serviceType>/<appId>/{get/set}/data/<oi4Identifier>/<filter>
                - oi4/<serviceType>/<appId>/{get/set}/metadata/<oi4Identifier>/<filter>
                ---
                - oi4/<serviceType>/<appId>/get/license/<oi4Identifier>/<licenseId>
                - oi4/<serviceType>/<appId>/get/licenseText/<oi4Identifier>/<licenseId>
                ---
                - oi4/<serviceType>/<appId>/{get/set}/publicationList/<oi4Identifier>/<resourceType>/<tag>
                - oi4/<serviceType>/<appId>/{get/set/del}/subscriptionList/<oi4Identifier>/<resourceType>/<tag>

         Example of topic string
            oi4/OTConnector/mymanufacturer.com/myModel/myProductCode/000-555/get/health/myManufacturer.com/myModel/myProductCode/000-555/oi4_pv
             0       1     |     2               3           4          5   | 6    7           8          #   9       10          11      12
                           |                Topic App Id                    |                             #       (subResource)         #

         */

        const topicArray = topic.split('/');
        const topicAppId = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
        const topicMethod = topicArray[6];
        const topicResource = topicArray[7];
        let topicFilter = undefined;
        let licenseId = undefined;
        let subResource = undefined;
        let topicTag = undefined;

        if(topicArray.length >= 8) {
            switch(topicResource) {
                case ResourceType.LICENSE_TEXT:
                case ResourceType.LICENCE: {
                    licenseId = topicArray[8];
                    break;
                }

                case ResourceType.PUBLICATION_LIST:
                case ResourceType.SUBSCRIPTION_LIST: {
                    subResource = `${topicArray[8]}/${topicArray[9]}/${topicArray[10]}/${topicArray[11]}`;
                    topicTag = topicArray[12]
                    break;
                }

                default: {
                    topicFilter = topicArray[8];
                }
            }
        }

        return {topic: topic, appId: topicAppId, method:topicMethod, resource:topicResource, filter:topicFilter, licenseId: licenseId, subResource:subResource, topicTag: topicTag};
    }

    private async processMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {
        // The following switch/case reacts depending on the different topic elements
        // The message is directed directly at us
        if (topicInfo.appId === this.applicationResources.oi4Id) {
            switch (topicInfo.method) {
                case TopicMethods.GET: {
                    await this.executeGetActions(topicInfo, parsedMessage, builder)
                    break;
                }
                case TopicMethods.PUB: {
                    break; // Only break here, because we should not react to our own publication messages
                }
                case TopicMethods.SET: {
                    await this.executeSetActions(topicInfo, parsedMessage);
                    break;
                }
                case TopicMethods.DEL: {
                    await this.executeDelActions(topicInfo);
                    break;
                }
                default: {
                    break;
                }
            }
            // External Request (External device put this on the message bus, we need this for birth messages)
        } else {
            LOGGER.log(`Detected Message from: ${topicInfo.appId}`)
        }
    }

    private async executeGetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {

        if (topicInfo.resource === this.DATA) {
            this.emitter.emit('getData', {topic: topicInfo.topic, message: parsedMessage});
            return;
        } else if (topicInfo.resource === this.METADATA) {
            await this.sendMetaData(topicInfo.filter);
            return;
        }

        OI4RegistryManager.checkForOi4Registry(parsedMessage);

        let payloadType: string = PayloadTypes.EMPTY;
        let page = 0;
        let perPage = 0;

        if (parsedMessage.Messages.length !== 0) {
            for (const messages of parsedMessage.Messages) {
                payloadType = await builder.checkPayloadType(messages.Payload);
                if (payloadType === PayloadTypes.LOCALE) {
                    LOGGER.log('Detected a locale request, but we can only send en-US!', ESyslogEventFilter.informational);
                }
                if (payloadType === PayloadTypes.PAGINATION) {
                    page = messages.Payload.page;
                    perPage = messages.Payload.perPage;
                    if (page === 0 || perPage === 0) {
                        LOGGER.log('Pagination requested either page or perPage 0, aborting send...');
                        return;
                    }
                }
                if (payloadType === PayloadTypes.NONE) { // Not empty, locale or pagination
                    LOGGER.log('Message must be either empty, locale or pagination type in a /get/ request. Aboring get operation.', ESyslogEventFilter.informational);
                    return;
                }
            }
        }

        this.sendResource(topicInfo.resource, parsedMessage.MessageId, topicInfo.subResource, topicInfo.filter, page, perPage)
    }

    private async executeSetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage){
        switch (topicInfo.resource) {
            case this.DATA: {
                this.setData(topicInfo.filter, parsedMessage);
                break;
            }
            case ResourceType.CONFIG: {
                if(parsedMessage.Messages !== undefined && parsedMessage.Messages.length > 0) {
                    this.setConfig(topicInfo.filter, parsedMessage);
                }
                break;
            }
            default: {
                break;
            }
        }
    }

    // SET Function section ------//
    private setData(cutTopic: string, data: IOPCUANetworkMessage) {
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (tagName === '') {
            return;
        }
        if (!(tagName in dataLookup)) {
            this.applicationResources.dataLookup[tagName] = data;
            LOGGER.log(`Added ${tagName} to dataLookup`);
        } else {
            this.applicationResources.dataLookup[tagName] = data; // No difference if we create the data or just update it with an object
            LOGGER.log(`${tagName} already exists in dataLookup`);
        }
    }

    private setConfig(filter: string, config: IOPCUANetworkMessage): void {
        const currentConfig = this.applicationResources.config;
        const newConfig: IContainerConfigGroupName | IContainerConfigConfigName = config.Messages[0].Payload;
        if (filter === '') {
            return;
        }
        if (!(filter in currentConfig)) {
            currentConfig[filter] = newConfig;
            LOGGER.log(`Added ${filter} to config group`);
        } else {
            currentConfig[filter] = newConfig; // No difference if we create the data or just update it with an object
            LOGGER.log(`${filter} already exists in config group`);
        }
        OI4RegistryManager.checkForOi4Registry(config);
        const status: StatusEvent = new StatusEvent(OI4RegistryManager.getOi4Id(), EOPCUAStatusCode.Good);

        this.emitter.emit('setConfig', status);
        this.sendResource(ResourceType.CONFIG,config.MessageId, filter);
    }

    private async executeDelActions(topicInfo: TopicInfo){
        switch (topicInfo.resource) {
            case this.DATA: {
                this.deleteData(topicInfo.filter);
                break;
            }
            default: {
                break;
            }
        }
    }

    /**
     * Legacy: TODO: This is not specified by the specification yet
     * @param cutTopic - todo
     */
    private deleteData(cutTopic: string) {
        // ONLY SPECIFIC DATA CAN BE DELETED. WILDCARD DOES NOT DELETE EVERYTHING
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (tagName === '') {
            return;
        }
        if ((tagName in dataLookup)) {
            delete this.applicationResources.dataLookup[tagName];
            LOGGER.log(`Deleted ${tagName} from dataLookup`, ESyslogEventFilter.warning);
        } else {
            LOGGER.log(`Cannot find ${tagName} in lookup`, ESyslogEventFilter.warning);
        }
    }

}