import {TopicWrapper} from './Types';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {DataSetClassIds, ESyslogEventFilter} from '@oi4/oi4-oec-service-model';
import {IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';

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

    //TODO refine this method
    private static checkForMalformedTopic(wrapper: TopicWrapper) {
        //const resource: Resource = wrapper.topicInfo.resource;
        const topicAttributesNr = wrapper.topicArray.length;
        //const method: TopicMethods = wrapper.topicInfo.method;

        const isTopicStructureMalformed =
                    MessageValidator.checkTopicLength(topicAttributesNr) ||
                    //MessageValidator.checkAgainstTopicLength10(method, resource, topicAttributesNr) ||
                    //MessageValidator.checkAgainstTopicLength12(method, resource, topicAttributesNr)
                    false;

        if(isTopicStructureMalformed) {
            throw new Error(`Invalid topic string structure ${wrapper.topicInfo.topic}`);
        }
    }

    private static checkTopicLength(topicAttributesNr: number) {
        return topicAttributesNr < 8 || topicAttributesNr == 9 || topicAttributesNr == 11 || topicAttributesNr > 14;
    }

    /*
    static checkAgainstTopicLength10(method: string, resource: Resource, topicAttributesNr: number) {
        return topicAttributesNr != 10 && method === TopicMethods.PUB && resource === Resource.EVENT;
    }

    static checkAgainstTopicLength12(method: string, resource: Resource, topicAttributesNr: number) {
        return topicAttributesNr != 12 && (
                   (method === TopicMethods.SET || method === TopicMethods.DEL) && resource === Resource.REFERENCE_DESIGNATION ||
                   method === TopicMethods.PUB && resource === Resource.INTERFACE ||
                   method === TopicMethods.SET && resource === Resource.DATA ||
                   method === TopicMethods.SET && resource === Resource.CONFIG
               )
    }
    */

}