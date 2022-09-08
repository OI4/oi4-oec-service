import {TopicWrapper} from "./TopicModel";

//FIXME: This is just the beginning of a draft, must be evaluated if it is worthy to implement this or not

export class TopicValidator {

    static isMalformedTopic(wrapper: TopicWrapper) {
        //const method: TopicMethods = wrapper.topicInfo.method;
        //const resource: Resource = wrapper.topicInfo.resource;
        const topicAttributesNr = wrapper.topicArray.length;

        return  (
                    topicAttributesNr < 8 || topicAttributesNr == 9 || topicAttributesNr == 11 || topicAttributesNr > 14
                    //TopicValidator.checkAgainstTopicLength10(method, resource, topicAttributesNr) ||
                    //TopicValidator.checkAgainstTopicLength12(method, resource, topicAttributesNr)
                );
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
