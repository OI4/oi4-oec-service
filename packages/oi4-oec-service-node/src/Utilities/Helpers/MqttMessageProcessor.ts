import {
    DataSetClassIds,
    ESyslogEventFilter,
    StatusEvent,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IOI4ApplicationResources,
    Resource
} from '@oi4/oi4-oec-service-model';
import {EOPCUAStatusCode, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {TopicInfo, ValidatedIncomingMessageData, ValidatedMessage} from './Types';
import {TopicMethods, PayloadTypes} from './Enums';
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
        if (!validatedData.areValid) {
            return;
        }

        await this.processMessage(validatedData.topicInfo, validatedData.parsedMessage, builder);
    }

    private validateData(topic: string, message: Buffer, builder: OPCUABuilder): ValidatedIncomingMessageData {
        const validateMessage: ValidatedMessage = this.validateIncomingMessage(message);
        if (!validateMessage.isValid) {
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
        } else if (validateMessage.parsedMessage.Messages.length === 0) {
            LOGGER.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.informational);
        }

        if(topic.indexOf(`/${TopicMethods.PUB}/`) != -1) {
            LOGGER.log(`No reaction needed to our own publication messages${topic.substring(topic.indexOf(`/${TopicMethods.PUB}/`), topic.length)}`);
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
        }

        const schemaResult = this.getSchemaResult(builder, validateMessage.parsedMessage);
        if (!this.areSchemaResultAndBuildValid(schemaResult, builder, topic)) {
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
        }

        // Split the topic into its different elements
        const topicInfo: TopicInfo = this.extractTopicInfo(topic);

        // Safety-Check: DataSetClassId
        if (validateMessage.parsedMessage.DataSetClassId !== DataSetClassIds[topicInfo.resource]) {
            LOGGER.log(`Error in pre-check, dataSetClassId mismatch, got ${validateMessage.parsedMessage.DataSetClassId}, expected ${DataSetClassIds[topicInfo.resource]}`, ESyslogEventFilter.warning);
            return {areValid: false, parsedMessage: undefined, topicInfo: undefined};
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

    /**
     Accordingly to the guideline, these are the possible generic requests

     - oi4/<serviceType>/<appId>/get/mam                                /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/get/health                             /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/get/rtLicense                          /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/get/profile                            /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/{get/set/del}/referenceDesignation     /<oi4Identifier>?
     --- length = 8 -> no oi4Id
     --- length = 12 -> yes Oi4Id

     - oi4/<serviceType>/<appId>/{get/set}/config                       /<oi4Identifier>?/<filter>?
     - oi4/<serviceType>/<appId>/{get/set}/data                         /<oi4Identifier>?/<filter>?
     - oi4/<serviceType>/<appId>/{get/set}/metadata                     /<oi4Identifier>?/<filter>?
     --- length = 8 -> no oi4Id and no filter
     --- length = 12 -> yes Oi4Id but no filter
     --- length = 13 -> yes oi4Id and yes filter

     - oi4/<serviceType>/<appId>/get/license                            /<oi4Identifier>?/<licenseId>?
     - oi4/<serviceType>/<appId>/get/licenseText                        /<oi4Identifier>?/<licenseId>?
     --- length = 8 -> no oi4Id and no licenseId
     --- length = 12 -> yes Oi4Id but no licenseId
     --- length = 13 -> yes oi4Id and yes licenseId

     - oi4/<serviceType>/<appId>/{get/set}/publicationList              /<oi4Identifier>?/<resourceType>?/<tag>?
     - oi4/<serviceType>/<appId>/{get/set/del}/subscriptionList         /<oi4Identifier>?/<resourceType>?/<tag>?
     --- length = 8 -> no oi4Identifier and no resourceType and no tag
     --- length = 12 -> yes oi4Identifier and no resourceType and no tag
     --- length = 14 -> yes oi4Identifier and yes resourceType and yes tag
     */
    private extractTopicInfo(topic: string): TopicInfo {
        //FIXME Add the parsing of the pub event

        const topicArray = topic.split('/');
        const topicInfo: TopicInfo = this.extractCommonInfo(topic, topicArray);

        if(topicArray.length > 12) {
            this.extractResourceSpecificInfo(topic, topicArray, topicInfo);
        }

        return topicInfo;
    }

    private extractCommonInfo(topic: string, topicArray: Array<string>): TopicInfo {
        const topicInfo: TopicInfo = {
            topic: topic,
            appId: `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`,
            method: topicArray[6],
            resource: topicArray[7],
            oi4Id: undefined,
            filter: undefined,
            licenseId: undefined,
            subResource: undefined,
            topicTag: undefined,
        };

        if (topicArray.length >= 12) {
            if(this.isAtLeastOneStringEmpty([topicArray[8], topicArray[9], topicArray[10], topicArray[11]])) {
                throw new Error(`Malformed Oi4Id : ${topic}`);
            }
            topicInfo.oi4Id = `${topicArray[8]}/${topicArray[9]}/${topicArray[10]}/${topicArray[11]}`;
        }

        return topicInfo;
    }

    private extractResourceSpecificInfo(topic: string, topicArray: Array<string>, topicInfo: TopicInfo) {
        switch (topicInfo.resource) {
            case Resource.CONFIG:
            case Resource.DATA:
            case Resource.METADATA: {
                if (this.isStringEmpty(topicArray[12])) {
                    throw new Error(`Invalid filter: ${topic}`);
                }
                topicInfo.filter = topicArray[12];
                break;
            }

            case Resource.LICENSE_TEXT:
            case Resource.LICENSE: {
                if (this.isStringEmpty(topicArray[12])) {
                    throw new Error(`Invalid licenseId: ${topic}`);
                }
                topicInfo.licenseId = topicArray[12];
                break;
            }

            case Resource.PUBLICATION_LIST:
            case Resource.SUBSCRIPTION_LIST: {
                if (this.isAtLeastOneStringEmpty([topicArray[12], topicArray[13]])) {
                    throw new Error(`Invalid resourceType/tag: ${topic}`);
                }
                topicInfo.subResource = topicArray[12];
                topicInfo.topicTag = topicArray[13];
                break;
            }
        }
    }

    private isAtLeastOneStringEmpty(strings: Array<string>) {
        for (const str of strings) {
            if(this.isStringEmpty(str)) {
                return true;
            }
        }
        return false;
    }

    private isStringEmpty(str: string) {
        return str === undefined || str === null || str.length == 0;
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

    private async executeSetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage) {
        switch (topicInfo.resource) {
            case this.DATA: {
                this.setData(topicInfo.filter, parsedMessage);
                break;
            }
            case Resource.CONFIG: {
                if (parsedMessage.Messages !== undefined && parsedMessage.Messages.length > 0) {
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
        const filter = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.applicationResources.dataLookup;
        if (filter === '') {
            return;
        }
        if (!(filter in dataLookup)) {
            this.applicationResources.dataLookup[filter] = data;
            LOGGER.log(`Added ${filter} to dataLookup`);
        } else {
            this.applicationResources.dataLookup[filter] = data; // No difference if we create the data or just update it with an object
            LOGGER.log(`${filter} already exists in dataLookup`);
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
        this.sendResource(Resource.CONFIG, config.MessageId, filter);
    }

    private async executeDelActions(topicInfo: TopicInfo) {
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