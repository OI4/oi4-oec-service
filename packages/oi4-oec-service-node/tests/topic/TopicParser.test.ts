import {Methods, Resources, ServiceTypes} from '@oi4/oi4-oec-service-model';

import {TopicInfo, TopicWrapper, TopicParser} from '../../src';
import {MessageFactory, MessageItems} from '../testUtils/Factories/MessageFactory';

describe('Unit test for TopicParser', () => {

    const defaultMessageItems: MessageItems = MessageFactory.getDefaultMessageItems();
    const topicPrefix: string = defaultMessageItems.getTopicPrefix();

    function getTopicWrapper(topic = defaultMessageItems.topic) {
        return TopicParser.getTopicWrapperWithCommonInfo(topic);
    }

    it('If the appId is invalid an error is thrown', async () => {
        const topic = `${topicPrefix}/mymanufacturer.com//1/1/${defaultMessageItems.method}/${defaultMessageItems.resource}`;
        expect(() => {
            TopicParser.getTopicWrapperWithCommonInfo(topic);
        }).toThrowError(`Invalid App id: ${topic}`);
    });

    it('Common information are properly extracted', async () => {
        const wrapper: TopicWrapper = getTopicWrapper(defaultMessageItems.topic);
        expect(wrapper.topicInfo.topic).toStrictEqual(defaultMessageItems.topic);
        expect(wrapper.topicInfo.appId).toStrictEqual(defaultMessageItems.appId);
        expect(wrapper.topicInfo.method).toStrictEqual(defaultMessageItems.method);
        expect(wrapper.topicInfo.resource).toStrictEqual(defaultMessageItems.resource);
        expect(wrapper.topicInfo.serviceType).toStrictEqual(ServiceTypes.REGISTRY);
    });

    it('Pub event info are extracted', async () => {
        const topic = `${topicPrefix}/${defaultMessageItems.appId}/${Methods.PUB}/${Resources.EVENT}/${defaultMessageItems.category}/${defaultMessageItems.filter}`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.category).toStrictEqual(defaultMessageItems.category);
        expect(info.filter).toStrictEqual(defaultMessageItems.filter);
    });

    function checkAgainstErrorForPubEvent(topic: string, errMsg: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {
            TopicParser.extractResourceSpecificInfo(wrapper);
        }).toThrowError(errMsg);
    }

    it('Invalid info for Pub event generate an error', async () => {
        let topic = `${topicPrefix}/${defaultMessageItems.appId}/${Methods.PUB}/${Resources.EVENT}//${defaultMessageItems.filter}`;
        checkAgainstErrorForPubEvent(topic, `Invalid category: ${topic}`);

        topic = `${topicPrefix}/${defaultMessageItems.appId}/${Methods.PUB}/${Resources.EVENT}/${defaultMessageItems.category}/`;
        checkAgainstErrorForPubEvent(topic, `Invalid filter: ${topic}`);
    });

    it('Malformed Oi4Id generate an error', async () => {
        const topic = `${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${defaultMessageItems.resource}////`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {
            TopicParser.extractResourceSpecificInfo(wrapper);
        }).toThrowError(`Malformed Oi4Id : ${topic}`);
    });

    it('Oi4Id is properly extracted', async () => {
        const topic = `${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${defaultMessageItems.resource}/${defaultMessageItems.oi4Id}`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.source).toStrictEqual(defaultMessageItems.oi4Id);
    });

    function checkFilter(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.filter).toStrictEqual(defaultMessageItems.filter);
    }

    it('In case of config, data and metadata, filter is properly extracted', async () => {
        checkFilter(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.CONFIG}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`);
        checkFilter(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.DATA}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`);
        checkFilter(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.METADATA}/${defaultMessageItems.oi4Id}/${defaultMessageItems.filter}`);
    });

    function checkFilterWithError(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {
            TopicParser.extractResourceSpecificInfo(wrapper)
        }).toThrowError('Invalid filter: ');
    }

    it('In case of config, data and metadata, invalid filter generates error', async () => {
        checkFilterWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.CONFIG}/${defaultMessageItems.oi4Id}/`);
        checkFilterWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.DATA}/${defaultMessageItems.oi4Id}/`);
        checkFilterWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.METADATA}/${defaultMessageItems.oi4Id}/`);
    });

    function checkLicense(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.licenseId).toStrictEqual(defaultMessageItems.licenseId);
    }

    it('In case of config, data and metadata, filter is properly extracted', async () => {
        checkLicense(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.LICENSE}/${defaultMessageItems.oi4Id}/${defaultMessageItems.licenseId}`);
        checkLicense(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.LICENSE_TEXT}/${defaultMessageItems.oi4Id}/${defaultMessageItems.licenseId}`);
    });

    function checkLicenseWithError(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {
            TopicParser.extractResourceSpecificInfo(wrapper)
        }).toThrowError('Invalid licenseId: ');
    }

    it('In case of config, data and metadata, invalid filter generates error', async () => {
        checkLicenseWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.LICENSE}/${defaultMessageItems.oi4Id}/`);
        checkLicenseWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.LICENSE_TEXT}/${defaultMessageItems.oi4Id}/`);
    });

    function checkList(topic: string, withTag = false) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.source).toStrictEqual(defaultMessageItems.source);
        if (withTag) {
            expect(info.filter).toStrictEqual(`${defaultMessageItems.source}/${defaultMessageItems.tag}`);
            expect(info.tag).toStrictEqual(defaultMessageItems.tag);
        } else {
            expect(info.filter).toStrictEqual(defaultMessageItems.source);
        }
    }

    it('In case of publicationList and subscriptionList, source and filter are properly extracted', async () => {
        checkList(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.PUBLICATION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}`);
        checkList(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.SUBSCRIPTION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}`);

        checkList(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.PUBLICATION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}/${defaultMessageItems.tag}`, true);
        checkList(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.SUBSCRIPTION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}/${defaultMessageItems.tag}`, true);
    });

    function checkListWithError(topic: string, withTag = false) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        if (withTag) {
            expect(() => {
                TopicParser.extractResourceSpecificInfo(wrapper)
            }).toThrowError('Invalid tag: ');
        } else {
            expect(() => {
                TopicParser.extractResourceSpecificInfo(wrapper)
            }).toThrowError(`Invalid source: ${topic}`);
        }
    }

    it('In case of publicationList and subscriptionList, Source and filter are properly extracted', async () => {
        checkListWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.PUBLICATION_LIST}/${defaultMessageItems.oi4Id}/`);
        checkListWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.SUBSCRIPTION_LIST}/${defaultMessageItems.oi4Id}/`);

        checkListWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.PUBLICATION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}/`, true);
        checkListWithError(`${topicPrefix}/${defaultMessageItems.appId}/${defaultMessageItems.method}/${Resources.SUBSCRIPTION_LIST}/${defaultMessageItems.oi4Id}/${defaultMessageItems.source}/`, true);
    });

});
