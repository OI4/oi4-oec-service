import {
    ESyslogEventFilter,
    IContainerConfig,
    Methods,
    Resources,
    StatusEvent
} from '@oi4/oi4-oec-service-model';
import {EOPCUAStatusCode, IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {TopicInfo, TopicWrapper} from '../topic/TopicModel';
import {TopicParser} from '../topic/TopicParser';
import {PayloadTypes} from './MessagingModel';
import {OI4RegistryManager} from '../application/OI4RegistryManager';
import EventEmitter from 'events';
import {MessageValidator} from './MessageValidator';
import {IOI4Application} from '../application/OI4Application';

export enum MqttMessageProcessorEventStatus {
    GET_DATA = 'getData',
    SET_CONFIG = 'setConfig',
}

export interface IMqttMessageProcessor extends EventEmitter {
    processMqttMessage(topic: string, message: Buffer, builder: OPCUABuilder, oi4Application: IOI4Application): Promise<void>;
    handleForeignMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage): Promise<void>;
}

export class MqttMessageProcessor extends EventEmitter implements IMqttMessageProcessor {

    async handleForeignMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage): Promise<void> {
        LOGGER.log(`Detected Message from: ${topicInfo.appId} with messageId: ${parsedMessage.MessageId}`, ESyslogEventFilter.informational);
    }

    /**
     * Processes the incoming mqtt message by parsing the different elements of the topic and reacting to it
     * @param topic - the incoming topic from the messagebus
     * @param message - the entire binary message from the messagebus
     * @param builder
     * @param oi4Application
     */
    public async processMqttMessage(topic: string, message: Buffer, builder: OPCUABuilder, oi4Application: IOI4Application): Promise<void> {
        try {
            const parsedMessage: IOPCUANetworkMessage = JSON.parse(message.toString());
            await MessageValidator.doPreliminaryValidation(topic, parsedMessage, builder);

            const wrapper: TopicWrapper = TopicParser.getTopicWrapperWithCommonInfo(topic);
            MessageValidator.doTopicDataValidation(wrapper, parsedMessage);

            const topicInfo: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
            await this.processMessage(topicInfo, parsedMessage, builder, oi4Application);
        } catch (e) {
            LOGGER.log(`Error while processing Mqtt Message: ${e.message}`, ESyslogEventFilter.warning);
            return;
        }
    }

    protected async processMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder, oi4Application: IOI4Application): Promise<void> {
        // Check if message is from the OI4 registry and save it if it is
        OI4RegistryManager.checkForOi4Registry(parsedMessage);

        // The following switch/case reacts depending on the different topic elements
        // The message is directed directly at us
        if (topicInfo?.appId?.equals(oi4Application.oi4Id)) {
            switch (topicInfo.method) {
                case Methods.GET: {
                    await this.executeGetActions(topicInfo, parsedMessage, builder, oi4Application);
                    break;
                }
                case Methods.PUB: {
                    LOGGER.log('No reaction needed to our own publish event', ESyslogEventFilter.informational);
                    break; // Only break here, because we should not react to our own publication messages
                }
                case Methods.SET: {
                    await this.executeSetActions(topicInfo, parsedMessage, oi4Application);
                    break;
                }
                case Methods.DEL: {
                    await this.executeDelActions(topicInfo, oi4Application);
                    break;
                }
                default: {
                    break;
                }
            }
            // External Request (External device put this on the message bus, we need this for birth messages)
        } else {
            await this.handleForeignMessage(topicInfo, parsedMessage);
        }
    }

    private async executeGetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder, oi4Application: IOI4Application): Promise<void> {

        if (topicInfo.resource === Resources.DATA) {
            // TODO should handle filter
            await oi4Application.sendData(topicInfo.oi4Id);
            return;
        } else if (topicInfo.resource === Resources.METADATA) {
            await oi4Application.sendMetaData(topicInfo.filter);
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
// TODO: this needs a rework. old subResource (now Source) is always an Oi4Identifier since V1.1 of the Guideline
        let subResource: string;
        let filter = undefined;
        const oi4IdSubResource = topicInfo.oi4Id?.toString();
        switch (topicInfo.resource)
        {
            case Resources.EVENT:
                subResource = `${topicInfo.category}/${topicInfo.filter}`;
                break;

            case Resources.LICENSE:
            case Resources.LICENSE_TEXT:
                subResource = oi4IdSubResource;
                filter = topicInfo.licenseId;
                break;

            case Resources.CONFIG:
                subResource = oi4IdSubResource;
                filter = topicInfo.filter;
                break;

            case Resources.PUBLICATION_LIST:
            case Resources.SUBSCRIPTION_LIST:
                subResource = oi4IdSubResource;
                filter = topicInfo.tag;
                break;

            default:
                subResource = oi4IdSubResource;
                break;
        }

        await oi4Application.sendResource(topicInfo.resource, parsedMessage.MessageId, subResource, filter, page, perPage)
    }

    private async executeSetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, oi4Application: IOI4Application) {
        switch (topicInfo.resource) {
            case Resources.DATA: {
                this.setData(topicInfo.filter, parsedMessage, oi4Application);
                break;
            }
            case Resources.CONFIG: {
                if (parsedMessage.Messages !== undefined && parsedMessage.Messages.length > 0) {
                    await this.setConfig(topicInfo, parsedMessage, oi4Application);
                }
                break;
            }
            default: {
                break;
            }
        }
    }

    // SET Function section ------//
    private setData(cutTopic: string, data: IOPCUANetworkMessage, oi4Application: IOI4Application) {
        const applicationResources = oi4Application.applicationResources;
        const filter = cutTopic;
        // This topicObject is also specific to the Resources. The data resource will include the TagName!
        const dataLookup = applicationResources.dataLookup;
        if (filter === '') {
            return;
        }
        if (!(filter in dataLookup)) {
            applicationResources.dataLookup[filter] = data;
            LOGGER.log(`Added ${filter} to dataLookup`);
        } else {
            applicationResources.dataLookup[filter] = data; // No difference if we create the data or just update it with an object
            LOGGER.log(`${filter} already exists in dataLookup`);
        }
    }

    private async setConfig(topicInfo: TopicInfo, config: IOPCUANetworkMessage, oi4Application: IOI4Application): Promise<void> {
        const applicationResources = oi4Application.applicationResources;
        const filter = topicInfo.filter;
        const oi4Id = topicInfo.oi4Id;

        const message = config.Messages[0]; // only one message is allowed for set/config so we ignore further messages
        const result = applicationResources.setConfig(oi4Id, filter, message.Payload as IContainerConfig);
        const statusCode = result ? EOPCUAStatusCode.Good : EOPCUAStatusCode.Bad;

        const status: StatusEvent = new StatusEvent(statusCode);
        await oi4Application.sendEventStatus(status, oi4Id.toString());
        await oi4Application.sendResource(Resources.CONFIG, config.MessageId, applicationResources.oi4Id.toString(), filter, 0, 0); // TODO set source. Still valid?!
    }


    private async executeDelActions(topicInfo: TopicInfo, oi4Application: IOI4Application) {
        switch (topicInfo.resource) {
            case Resources.DATA: {
                this.deleteData(topicInfo.filter, oi4Application);
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
    private deleteData(cutTopic: string, oi4Application: IOI4Application) {
        const applicationResources = oi4Application.applicationResources;
        // ONLY SPECIFIC DATA CAN BE DELETED. WILDCARD DOES NOT DELETE EVERYTHING
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = applicationResources.dataLookup;
        if (tagName === '') {
            return;
        }
        if ((tagName in dataLookup)) {
            delete applicationResources.dataLookup[tagName];
            LOGGER.log(`Deleted ${tagName} from dataLookup`, ESyslogEventFilter.warning);
        } else {
            LOGGER.log(`Cannot find ${tagName} in lookup`, ESyslogEventFilter.warning);
        }
    }

}
