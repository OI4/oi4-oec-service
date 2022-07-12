import {Resource} from '@oi4/oi4-oec-service-model';
import {TopicMethods} from './Enums';
import {TopicWrapper} from "./Types";

export class TopicValidator {

    /**
     Accordingly to the guideline, these are the possible generic requests

     - oi4/<serviceType>/<appId>/pub/event                                      /<category>/<filter>
     --- length = 10 -> ALL fields are mandatory

     - oi4/<serviceType>/<appId>/{get/pub}/mam                                  /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/{get/pub}/health                               /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/{get/pub}/rtLicense                            /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/{get/pub}/profile                              /<oi4Identifier>?
     --- length = 8 -> no oi4Id
     --- length = 12 -> yes Oi4Id

     - oi4/<serviceType>/<appId>/{get/pub}/referenceDesignation                 /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/{get}/interfaces                               /<oi4Identifier>?
     --- length = 8 -> no oi4Id
     --- length = 12 -> yes Oi4Id
     - oi4/<serviceType>/<appId>/{set/del}/referenceDesignation                 /<oi4Identifier>?
     - oi4/<serviceType>/<appId>/pub/interfaces                                 /<oi4Identifier>?
     --- length = 12 -> yes Oi4Id

     - oi4/<serviceType>/<appId>/{get/pub}/config                               /<oi4Identifier>?/<filter>?
     - oi4/<serviceType>/<appId>/{get/pub}/data                                 /<oi4Identifier>?/<filter>?
     --- length = 8 -> no oi4Id and no filter
     --- length = 12 -> yes Oi4Id but no filter
     --- length = 13 -> yes oi4Id and yes filter
     - oi4/<serviceType>/<appId>/set/config                                     /<oi4Identifier>?/<filter>?
     - oi4/<serviceType>/<appId>/set/data                                       /<oi4Identifier>?/<filter>?
     --- length = 13 -> ALL fields are mandatory

     - oi4/<serviceType>/<appId>/{get/set/pub}/metadata                         /<oi4Identifier>?/<filter>?
     --- length = 13 -> ALL fields are mandatory

     - oi4/<serviceType>/<appId>/{get/pub}/license                              /<oi4Identifier>?/<licenseId>?
     - oi4/<serviceType>/<appId>/{get/pub}/licenseText                          /<oi4Identifier>?/<licenseId>?
     --- length = 8 -> no oi4Id and no licenseId
     --- length = 12 -> yes Oi4Id but no licenseId
     --- length = 13 -> yes oi4Id and yes licenseId

     - oi4/<serviceType>/<appId>/{get/pub}/publicationList                      /<oi4Identifier>?/<resourceType>?/<tag>?
     - oi4/<serviceType>/<appId>/{get/pub}/subscriptionList                     /<oi4Identifier>?/<resourceType>?/<tag>?
     --- length = 8 -> no oi4Identifier and no resourceType and no tag
     --- length = 12 -> yes oi4Identifier and no resourceType and no tag
     --- length = 13 -> yes oi4Identifier, yes resourceType and no tag
     --- length = 14 -> yes oi4Identifier, yes resourceType and yes tag
     - oi4/<serviceType>/<appId>/set/publicationList                            /<oi4Identifier>?/<resourceType>?/<tag>?
     - oi4/<serviceType>/<appId>/{set/del}/subscriptionList                     /<oi4Identifier>?/<resourceType>?/<tag>?
     --- length = 13 -> yes oi4Identifier, yes resourceType and no tag
     --- length = 14 -> yes oi4Identifier, yes resourceType and yes tag
     */

    static isMalformedTopic(wrapper: TopicWrapper) {
        const method: TopicMethods = wrapper.topicInfo.method;
        const resource: Resource = wrapper.topicInfo.resource;
        const topicAttributesNr = wrapper.topicArray.length;

        return  (
                    topicAttributesNr < 8 || topicAttributesNr == 9 || topicAttributesNr == 11 || topicAttributesNr > 14 ||
                    TopicValidator.checkAgainstTopicLength10(method, resource, topicAttributesNr) ||
                    TopicValidator.checkAgainstTopicLength12(method, resource, topicAttributesNr)
                );
    }

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



}