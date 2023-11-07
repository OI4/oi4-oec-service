import {getResource, getServiceType, Methods, Oi4Identifier, Resources} from '@oi4/oi4-oec-service-model';
import {getTopicMethod, ITopicInfo, TopicInfo, TopicWrapper} from './TopicModel';

/**
 This TopicParser make a qualitative validation of the topic info, for example checking
 if the TopicModel attributes components has acceptable values (not null, not empty or undefined)
 */
export class TopicParser {

    /**
     Accordingly to the guideline, these are the possible generic requests
     - Oi4/<serviceType>/<appId>/pub/event                                      /<category>/<filter>
     --- length = 10 -> ALL fields are mandatory
     - Oi4/<serviceType>/<appId>/{get/pub}/mam                                  /<oi4Identifier>?
     - Oi4/<serviceType>/<appId>/{get/pub}/health                               /<oi4Identifier>?
     - Oi4/<serviceType>/<appId>/{get/pub}/rtLicense                            /<oi4Identifier>?
     - Oi4/<serviceType>/<appId>/{get/pub}/profile                              /<oi4Identifier>?
     --- length = 8 -> no oi4Id
     --- length = 12 -> yes Oi4Id
     - Oi4/<serviceType>/<appId>/{get/pub}/referenceDesignation                 /<oi4Identifier>?
     - Oi4/<serviceType>/<appId>/{get}/interfaces                               /<oi4Identifier>?
     --- length = 8 -> no oi4Id
     --- length = 12 -> yes Oi4Id
     - Oi4/<serviceType>/<appId>/{set/del}/referenceDesignation                 /<oi4Identifier>?
     - Oi4/<serviceType>/<appId>/pub/interfaces                                 /<oi4Identifier>?
     --- length = 12 -> yes Oi4Id
     - Oi4/<serviceType>/<appId>/{get/pub}/config                               /<oi4Identifier>?/<filter>?
     - Oi4/<serviceType>/<appId>/{get/pub}/data                                 /<oi4Identifier>?/<filter>?
     --- length = 8 -> no oi4Id and no filter
     --- length = 12 -> yes Oi4Id but no filter
     --- length = 13 -> yes oi4Id and yes filter
     - Oi4/<serviceType>/<appId>/set/config                                     /<oi4Identifier>?/<filter>?
     - Oi4/<serviceType>/<appId>/set/data                                       /<oi4Identifier>?/<filter>?
     --- length = 13 -> ALL fields are mandatory
     - Oi4/<serviceType>/<appId>/{get/set/pub}/metadata                         /<oi4Identifier>?/<filter>?
     --- length = 13 -> ALL fields are mandatory
     - Oi4/<serviceType>/<appId>/{get/pub}/license                              /<oi4Identifier>?/<licenseId>?
     - Oi4/<serviceType>/<appId>/{get/pub}/licenseText                          /<oi4Identifier>?/<licenseId>?
     --- length = 8 -> no oi4Id and no licenseId
     --- length = 12 -> yes Oi4Id but no licenseId
     --- length = 13 -> yes oi4Id and yes licenseId
     - Oi4/<serviceType>/<appId>/{get/pub}/publicationList                      /<oi4Identifier>?/<resourceType>?/<tag>?
     - Oi4/<serviceType>/<appId>/{get/pub}/subscriptionList                     /<oi4Identifier>?/<resourceType>?/<tag>?
     --- length = 8 -> no oi4Identifier and no resourceType and no tag
     --- length = 12 -> yes oi4Identifier and no resourceType and no tag
     --- length = 13 -> yes oi4Identifier, yes resourceType and no tag
     --- length = 14 -> yes oi4Identifier, yes resourceType and yes tag
     - Oi4/<serviceType>/<appId>/set/publicationList                            /<oi4Identifier>?/<resourceType>?/<tag>?
     - Oi4/<serviceType>/<appId>/{set/del}/subscriptionList                     /<oi4Identifier>?/<resourceType>?/<tag>?
     --- length = 13 -> yes oi4Identifier, yes resourceType and no tag
     --- length = 14 -> yes oi4Identifier, yes resourceType and yes tag
     */

    static getTopicWrapperWithCommonInfo(topic: string): TopicWrapper {
        const topicArray = topic.split('/');
        const topicInfo: ITopicInfo = TopicParser.extractCommonInfo(topic, topicArray);
        return {topicArray, topicInfo, raw: topic};
    }

    private static extractCommonInfo(topic: string, topicArray: Array<string>): ITopicInfo {
        if (TopicParser.isAtLeastOneStringEmpty([topicArray[2], topicArray[3], topicArray[4], topicArray[5]])) {
            throw new Error(`Invalid App id: ${topic}`);
        }

        return new TopicInfo(getServiceType(topicArray[1]), Oi4Identifier.fromString(`${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`), getTopicMethod(topicArray[6]), getResource(topicArray[7]));
    }

    static extractResourceSpecificInfo(wrapper: TopicWrapper): ITopicInfo {
        if (wrapper.topicInfo.method === Methods.PUB && wrapper.topicInfo.resource === Resources.EVENT) {
            TopicParser.extractPubEventInfo(wrapper);
        } else {
            TopicParser.extractResourceInfo(wrapper);
        }

        return wrapper.topicInfo;
    }

    private static extractPubEventInfo(wrapper: TopicWrapper): void {
        wrapper.topicInfo.category = TopicParser.extractItem(wrapper, 8, 'Invalid category: ');
        wrapper.topicInfo.filter = TopicParser.extractItem(wrapper, 9, 'Invalid filter: ');
    }

    private static extractResourceInfo(wrapper: TopicWrapper): void {
        if (wrapper.topicArray.length >= 12) {

            TopicParser.extractSource(wrapper);

            if (wrapper.topicArray.length > 12) {
                switch (wrapper.topicInfo.resource) {
                    case Resources.CONFIG:
                    case Resources.DATA:
                    case Resources.METADATA: {
                        TopicParser.extractFilter(wrapper)
                        break;
                    }

                    case Resources.LICENSE_TEXT:
                    case Resources.LICENSE: {
                        TopicParser.extractLicense(wrapper);
                        break;
                    }

                    case Resources.PUBLICATION_LIST:
                    case Resources.SUBSCRIPTION_LIST: {
                        TopicParser.extractListInfo(wrapper);
                        break;
                    }
                }
            }
        }
    }

    private static extractSource(wrapper: TopicWrapper): void {
        if (TopicParser.isAtLeastOneStringEmpty([wrapper.topicArray[8], wrapper.topicArray[9], wrapper.topicArray[10], wrapper.topicArray[11]])) {
            throw new Error(`Malformed Oi4Id : ${wrapper.raw}`);
        }
        wrapper.topicInfo.source = new Oi4Identifier(wrapper.topicArray[8], wrapper.topicArray[9], wrapper.topicArray[10], wrapper.topicArray[11], true);
    }

    private static extractFilter(wrapper: TopicWrapper): void {
        wrapper.topicInfo.filter = TopicParser.extractItem(wrapper, 12, 'Invalid filter: ');
    }

    private static extractLicense(wrapper: TopicWrapper): void {
        wrapper.topicInfo.licenseId = TopicParser.extractItem(wrapper, 12, 'Invalid licenseId: ');
    }

    private static extractListInfo(wrapper: TopicWrapper): void {
        wrapper.topicInfo.source = Oi4Identifier.fromDNPString(TopicParser.extractItem(wrapper, 12, 'Invalid source: '));
        wrapper.topicInfo.filter = wrapper.topicInfo.source.toString();
        if (wrapper.topicArray.length == 14) {
            wrapper.topicInfo.tag = TopicParser.extractItem(wrapper, 13, 'Invalid tag: ');
            wrapper.topicInfo.filter += `/${wrapper.topicInfo.tag}`;
        }
    }

    private static extractItem(wrapper: TopicWrapper, index: number, errorMsg: string): string {
        if (TopicParser.isStringEmpty(wrapper.topicArray[index])) {
            throw new Error(`${errorMsg}${wrapper.raw}`);
        }
        return wrapper.topicArray[index];
    }

    private static isAtLeastOneStringEmpty(strings: Array<string>): boolean {
        return strings.filter(str => TopicParser.isStringEmpty(str)).length > 0;
    }

    private static isStringEmpty(string: string): boolean {
        return string === undefined || string === null || string.length == 0;
    }

}
