import {TopicInfo, TopicWrapper} from './Types';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {DataSetClassIds, ESyslogEventFilter, Resource} from '@oi4/oi4-oec-service-model';
import {IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {TopicMethods} from './Enums';

/**
 The MessageValidator makes a qualitative validation on the publisherId and on the dataSetClassId,
 plus a quantitative validation of the TopicInfo (checks if the topic string structure is correct and
 carries enough information the the requested action)
 */
export class MessageValidator {

    static async doPreliminaryValidation(topic: string, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {
        if (parsedMessage.Messages.length === 0) {
            LOGGER.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.warning);
        }

        //If a check fails, an error is thrown
        MessageValidator.isPublisherIdMatching(topic, parsedMessage);
        await MessageValidator.areSchemaResultAndBuildValid(parsedMessage, builder, topic);
    }

    private static isPublisherIdMatching(topic: string, parsedMessage: IOPCUANetworkMessage) {
        //FIXME The PublisherId information is redundant, since it is specified both in the topic string and in the Payload. Is this ok?
        if(topic.indexOf(parsedMessage.PublisherId) == -1) {
            throw new Error(`ServiceType/AppID mismatch with Payload PublisherId: [Topic: ${topic} - Payload: ${parsedMessage.PublisherId}]`);
        }
    }

    private static async areSchemaResultAndBuildValid(parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder, topic: string) {
        try {
            await builder.checkOPCUAJSONValidity(parsedMessage);
        } catch (e) {
            let errMsg = '';
            if(typeof e === 'string') {
                errMsg = e;
            }  else if(e.message !== undefined) {
                errMsg = e.message;
            } else {
                errMsg = JSON.stringify(e);
            }
            throw new Error(`OPC UA validation failed with: ${errMsg}`);
        }

        if (!builder.checkTopicPath(topic)) {
            throw new Error('Malformed topic Path');
        }
    }

    static doTopicDataValidation(wrapper: TopicWrapper, parsedMessage: IOPCUANetworkMessage) {
        MessageValidator.checkDataSetClassId(wrapper, parsedMessage);
        MessageValidator.checkForMalformedTopic(wrapper);
    }

    private static checkDataSetClassId(wrapper: TopicWrapper, parsedMessage: IOPCUANetworkMessage) {
        // Safety-Check: DataSetClassId
        if (parsedMessage.DataSetClassId !== DataSetClassIds[wrapper.topicInfo.resource]) {
            throw new Error(`DataSetClassId mismatch, got ${parsedMessage.DataSetClassId}, expected ${DataSetClassIds[wrapper.topicInfo.resource]}`);
        }
    }
    
    private static checkForMalformedTopic(wrapper: TopicWrapper) {
        const allowedGetResourcesLength8And12 = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION, Resource.INTERFACE, Resource.CONFIG, Resource.DATA, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];
        let isTopicStructureMalformed;

        switch(wrapper.topicArray.length) {
            case 8: {
                isTopicStructureMalformed = MessageValidator.checkAgainstMalformedTopicLength8(wrapper.topicInfo, allowedGetResourcesLength8And12);
                break;
            };
            case 10: {
                isTopicStructureMalformed = MessageValidator.checkAgainstMalformedTopicLength10(wrapper.topicInfo);
                break;
            };
            case 12: {
                isTopicStructureMalformed = MessageValidator.checkAgainstMalformedTopicLength12(wrapper.topicInfo, allowedGetResourcesLength8And12);
                break;
            };
            case 13: {
                isTopicStructureMalformed = MessageValidator.checkAgainstMalformedTopicLength13(wrapper.topicInfo);
                break;
            };
            case 14: {
                isTopicStructureMalformed = MessageValidator.checkAgainstMalformedTopicLength14(wrapper.topicInfo);
                break;
            };
            default: {
                isTopicStructureMalformed = true;
            }
        }

        if(isTopicStructureMalformed) {
            throw new Error(`Invalid topic string structure ${wrapper.topicInfo.topic}`);
        }
    }

    private static checkAgainstMalformedTopicLength8(info: TopicInfo, allowedGetResources: Array<Resource>) {
        const allowedPubResources = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION, Resource.CONFIG, Resource.DATA, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];

        return this.checkAgainstResources(info, allowedGetResources, allowedPubResources);
    }

    private static checkAgainstMalformedTopicLength10(info: TopicInfo) {
        return info.method !== TopicMethods.PUB || info.resource !== Resource.EVENT;
    }

    private static checkAgainstMalformedTopicLength12(info: TopicInfo, allowedGetResources: Array<Resource>) {
        const allowedPubResources = [Resource.MAM, Resource.HEALTH, Resource.RT_LICENSE, Resource.PROFILE, Resource.REFERENCE_DESIGNATION, Resource.INTERFACE, Resource.CONFIG, Resource.DATA, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];
        const allowedSetDelResources = [Resource.REFERENCE_DESIGNATION];

        return this.checkAgainstResources(info, allowedGetResources, allowedPubResources, allowedSetDelResources, allowedSetDelResources);
    }

    private static checkAgainstMalformedTopicLength13(info: TopicInfo) {
        const allowedGetPubResources = [Resource.CONFIG, Resource.DATA, Resource.METADATA, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];
        const allowedSetResources = [Resource.CONFIG, Resource.DATA, Resource.METADATA, Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];
        const allowedDelResources = [Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];

        return this.checkAgainstResources(info, allowedGetPubResources, allowedGetPubResources, allowedSetResources, allowedDelResources);
    }

    private static checkAgainstMalformedTopicLength14(info: TopicInfo) {
        const allowedGetPubSetDelResources = [Resource.PUBLICATION_LIST, Resource.SUBSCRIPTION_LIST];
        
        return this.checkAgainstResources(info, allowedGetPubSetDelResources, allowedGetPubSetDelResources, allowedGetPubSetDelResources, allowedGetPubSetDelResources);
    }

    private static checkAgainstResources(info: TopicInfo, allowedGetResources: Array<Resource>, allowedPubResources: Array<Resource>, allowedSetResources: Array<Resource> = [], allowedDelResources: Array<Resource> = []) {
        switch(info.method) {
            case TopicMethods.GET: {
                return !allowedGetResources.includes(info.resource);
                break;
            };case TopicMethods.PUB: {
                return !allowedPubResources.includes(info.resource);
                break;
            };case TopicMethods.SET: {
                return !allowedSetResources.includes(info.resource);
                break;
            };case TopicMethods.DEL: {
                return !allowedDelResources.includes(info.resource);
                break;
            };
        }
    }

}