import {
    ESyslogEventFilter,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IOI4ApplicationResources,
    Resource,
    StatusEvent
} from '@oi4/oi4-oec-service-model';
import {EOPCUAStatusCode, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {TopicInfo, TopicWrapper} from './Types';
import {PayloadTypes, TopicMethods} from './Enums';
import {OI4RegistryManager} from '../../application/OI4RegistryManager';
import EventEmitter from 'events';
import {TopicParser} from './TopicParser';
import {MessageValidator} from './MessageValidator';

export declare type OnSendResource = (resource: string, messageId: string, subResource: string, filter: string, page: number, perPage: number) => Promise<void>;
export declare type OnSendMetaData = (cutTopic: string) => Promise<void>;

export class MqttMessageProcessor {
    private readonly sendMetaData: OnSendMetaData;
    private readonly sendResource: OnSendResource;
    private readonly METADATA = 'metadata';
    private readonly emitter: EventEmitter;

    private applicationResources: IOI4ApplicationResources;

    constructor(applicationResources: IOI4ApplicationResources, sendMetaData: OnSendMetaData, sendResource: OnSendResource, emitter: EventEmitter) {
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
        try {
            const parsedMessage: IOPCUANetworkMessage = JSON.parse(message.toString());
            await MessageValidator.doPreliminaryValidation(topic, parsedMessage, builder);

            const wrapper: TopicWrapper = TopicParser.getTopicWrapperWithCommonInfo(topic);
            MessageValidator.doTopicDataValidation(wrapper, parsedMessage);

            const topicInfo: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
            await this.processMessage(topicInfo, parsedMessage, builder);
        } catch (e) {
            LOGGER.log(`Error while processing Mqtt Message: ${e.message}`, ESyslogEventFilter.warning);
            return;
        }
    }

    private async processMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {
        // Check if message is from the OI4 registry and save it if it is
        OI4RegistryManager.checkForOi4Registry(parsedMessage);

        // The following switch/case reacts depending on the different topic elements
        // The message is directed directly at us
        if (topicInfo.appId === this.applicationResources.oi4Id) {
            switch (topicInfo.method) {
                case TopicMethods.GET: {
                    await this.executeGetActions(topicInfo, parsedMessage, builder)
                    break;
                }
                case TopicMethods.PUB: {
                    LOGGER.log('No reaction needed to our own publish event', ESyslogEventFilter.informational);
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
            this.handleForeignMessage(topicInfo, parsedMessage);
        }
    }

    protected handleForeignMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage) {
        LOGGER.log(`Detected Message from: ${topicInfo.appId} with messageId: ${parsedMessage.MessageId}`, ESyslogEventFilter.informational);
    }

    private async executeGetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {

        if (topicInfo.resource === Resource.DATA) {
            this.emitter.emit('getData', {topic: topicInfo.topic, message: parsedMessage});
            return;
        } else if (topicInfo.resource === this.METADATA) {
            await this.sendMetaData(topicInfo.filter);
            return;
        }

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
            case Resource.DATA: {
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
        const status: StatusEvent = new StatusEvent(this.applicationResources.oi4Id, EOPCUAStatusCode.Good);

        this.emitter.emit('setConfig', status);
        this.sendResource(Resource.CONFIG, config.MessageId, '', filter, 0, 0); // TODO set subResource
    }

    private async executeDelActions(topicInfo: TopicInfo) {
        switch (topicInfo.resource) {
            case Resource.DATA: {
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
