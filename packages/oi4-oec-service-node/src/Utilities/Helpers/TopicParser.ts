import {getResource, getServiceType, Resource} from '@oi4/oi4-oec-service-model';
import {TopicInfo, TopicWrapper} from './Types';
import {getTopicMethod, TopicMethods} from './Enums';
import {TopicValidator} from "./TopicValidator";

export class TopicParser {

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

    static parseTopic(topic: string): TopicInfo {
        /*
         * This parsing method implements just qualitative check, for example that the fields contains
         * non-empty values. Quantitative evaluations, such as regarding the proper topic length for
         * a specific method/resource pair, has not been implemented.
         */
        const topicArray = topic.split('/');
        const topicInfo: TopicInfo = TopicParser.extractCommonInfo(topic, topicArray);
        const wrapper: TopicWrapper = {topic, topicArray, topicInfo};

        //The purpose of the topic validator is to provide a quantitative check for the topic string
        //(E.g. If we have pub event, the topic string is composed by 10 parts). For now, the
        //TopicValidator is just a draft
        if(TopicValidator.isMalformedTopic(wrapper)) {
            throw new Error(`Invalid topic string structure ${topic}`);
        }

        return TopicParser.extractResourceSpecificInfo(wrapper);
    }

    private static extractCommonInfo(topic: string, topicArray: Array<string>) : TopicInfo {
        if(TopicParser.isAtLeastOneStringEmpty([topicArray[2],topicArray[3],topicArray[4],topicArray[5]])) {
            throw new Error(`Invalid App id: ${topic}`);
        }

        return {
            topic: topic,
            appId: `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`,
            method: getTopicMethod(topicArray[6]),
            resource: getResource(topicArray[7]),
            oi4Id: undefined,
            filter: undefined,
            category: undefined,
            serviceType: getServiceType(topicArray[1]),
            tag: undefined,
            licenseId: undefined,
            subResource: undefined,
        };
    }

    private static extractResourceSpecificInfo(wrapper: TopicWrapper) {
        if(wrapper.topicInfo.method === TopicMethods.PUB && wrapper.topicInfo.resource === Resource.EVENT) {
            TopicParser.extractPubEventInfo(wrapper);
        } else {
            TopicParser.extractResourceInfo(wrapper);
        }

        return wrapper.topicInfo;
    }

    private static extractPubEventInfo(wrapper: TopicWrapper) {
        wrapper.topicInfo.category = TopicParser.extractItem(wrapper, 8, 'Invalid category: ');
        wrapper.topicInfo.filter = TopicParser.extractItem(wrapper, 9, 'Invalid filter: ');
    }

    private static extractResourceInfo(wrapper: TopicWrapper) {
        if (wrapper.topicArray.length >= 12) {

            TopicParser.extractOi4Id(wrapper);

            if (wrapper.topicArray.length > 12) {
                switch (wrapper.topicInfo.resource) {
                    case Resource.CONFIG:
                    case Resource.DATA:
                    case Resource.METADATA: {
                        TopicParser.extractFilter(wrapper)
                        break;
                    }

                    case Resource.LICENSE_TEXT:
                    case Resource.LICENSE: {
                        TopicParser.extractLicense(wrapper);
                        break;
                    }

                    case Resource.PUBLICATION_LIST:
                    case Resource.SUBSCRIPTION_LIST: {
                        TopicParser.extractListInfo(wrapper);
                        break;
                    }
                }
            }
        }
    }

    private static extractOi4Id(wrapper: TopicWrapper) {
        if(TopicParser.isAtLeastOneStringEmpty([wrapper.topicArray[8], wrapper.topicArray[9], wrapper.topicArray[10], wrapper.topicArray[11]])) {
            throw new Error(`Malformed Oi4Id : ${wrapper.topic}`);
        }
        wrapper.topicInfo.oi4Id = `${wrapper.topicArray[8]}/${wrapper.topicArray[9]}/${wrapper.topicArray[10]}/${wrapper.topicArray[11]}`;
    }

    private static extractFilter(wrapper: TopicWrapper) {
        wrapper.topicInfo.filter = TopicParser.extractItem(wrapper, 12, 'Invalid filter: ');
    }

    private static extractLicense(wrapper: TopicWrapper) {
        wrapper.topicInfo.licenseId = TopicParser.extractItem(wrapper, 12, 'Invalid licenseId: ');
    }

    private static extractListInfo(wrapper: TopicWrapper) {
        wrapper.topicInfo.filter = TopicParser.extractItem(wrapper, 12, 'Invalid subresource: ');
        if(wrapper.topicArray.length == 14) {
            wrapper.topicInfo.tag = TopicParser.extractItem(wrapper, 13, 'Invalid tag: ');
            wrapper.topicInfo.filter += '/' + wrapper.topicInfo.tag;
        }
    }

    private static extractItem(wrapper: TopicWrapper, index: number, errorMsg: string) {
        if (TopicParser.isStringEmpty(wrapper.topicArray[index])) {
            throw new Error(`${errorMsg}${wrapper.topic}`);
        }
        return wrapper.topicArray[index];
    }

    private static isAtLeastOneStringEmpty(strings: Array<string>) {
        for (const str of strings) {
            if(TopicParser.isStringEmpty(str)) {
                return true;
            }
        }
        return false;
    }

    private static isStringEmpty(string: string) {
        return string === undefined || string === null || string.length == 0;
    }

}