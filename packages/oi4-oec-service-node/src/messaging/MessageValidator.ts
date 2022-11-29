import {TopicInfo, TopicWrapper} from '../topic/TopicModel';
import {logger} from '@oi4/oi4-oec-service-logger';
import {IOPCUANetworkMessage, OPCUABuilder, DataSetClassIds, ESyslogEventFilter, Methods, Resources} from '@oi4/oi4-oec-service-model';

/**
 The MessageValidator makes a qualitative validation on the publisherId and on the dataSetClassId,
 plus a quantitative validation of the TopicModel (checks if the topic string structure is correct and
 carries enough information the the requested action)
 */
export class MessageValidator {

    static async doPreliminaryValidation(topic: string, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {
        if (parsedMessage.Messages.length === 0) {
            logger.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.warning);
        }

        //If a check fails, an error is thrown
        await MessageValidator.areSchemaResultAndBuildValid(parsedMessage, builder, topic);
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
        const allowedGetResourcesLength8And12 = [Resources.MAM, Resources.HEALTH, Resources.RT_LICENSE, Resources.PROFILE, Resources.REFERENCE_DESIGNATION, Resources.INTERFACES, Resources.CONFIG, Resources.DATA, Resources.LICENSE, Resources.LICENSE_TEXT, Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];
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

    private static checkAgainstMalformedTopicLength8(info: TopicInfo, allowedGetResources: Array<Resources>) {
        const allowedPubResources = [Resources.MAM, Resources.HEALTH, Resources.RT_LICENSE, Resources.PROFILE, Resources.REFERENCE_DESIGNATION, Resources.CONFIG, Resources.DATA, Resources.LICENSE, Resources.LICENSE_TEXT, Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];

        return this.checkAgainstResources(info, allowedGetResources, allowedPubResources);
    }

    private static checkAgainstMalformedTopicLength10(info: TopicInfo) {
        return info.method !== Methods.PUB || info.resource !== Resources.EVENT;
    }

    private static checkAgainstMalformedTopicLength12(info: TopicInfo, allowedGetResources: Array<Resources>) {
        const allowedPubResources = [Resources.MAM, Resources.HEALTH, Resources.RT_LICENSE, Resources.PROFILE, Resources.REFERENCE_DESIGNATION, Resources.INTERFACES, Resources.CONFIG, Resources.DATA, Resources.LICENSE, Resources.LICENSE_TEXT, Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];
        const allowedSetDelResources = [Resources.REFERENCE_DESIGNATION];

        return this.checkAgainstResources(info, allowedGetResources, allowedPubResources, allowedSetDelResources, allowedSetDelResources);
    }

    private static checkAgainstMalformedTopicLength13(info: TopicInfo) {
        const allowedGetPubResources = [Resources.CONFIG, Resources.DATA, Resources.METADATA, Resources.LICENSE, Resources.LICENSE_TEXT, Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];
        const allowedSetResources = [Resources.CONFIG, Resources.DATA, Resources.METADATA, Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];
        const allowedDelResources = [Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];

        return this.checkAgainstResources(info, allowedGetPubResources, allowedGetPubResources, allowedSetResources, allowedDelResources);
    }

    private static checkAgainstMalformedTopicLength14(info: TopicInfo) {
        const allowedGetPubSetDelResources = [Resources.PUBLICATION_LIST, Resources.SUBSCRIPTION_LIST];

        return this.checkAgainstResources(info, allowedGetPubSetDelResources, allowedGetPubSetDelResources, allowedGetPubSetDelResources, allowedGetPubSetDelResources);
    }

    private static checkAgainstResources(info: TopicInfo, allowedGetResources: Array<Resources>, allowedPubResources: Array<Resources>, allowedSetResources: Array<Resources> = [], allowedDelResources: Array<Resources> = []) {
        switch(info.method) {
            case Methods.GET: {
                return !allowedGetResources.includes(info.resource);
                break;
            };case Methods.PUB: {
                return !allowedPubResources.includes(info.resource);
                break;
            };case Methods.SET: {
                return !allowedSetResources.includes(info.resource);
                break;
            };case Methods.DEL: {
                return !allowedDelResources.includes(info.resource);
                break;
            };
        }
    }

}
