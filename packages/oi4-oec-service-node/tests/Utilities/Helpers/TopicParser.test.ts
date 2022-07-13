import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {getServiceType, Resource} from '@oi4/oi4-oec-service-model';
import {TopicParser} from '../../../src/Utilities/Helpers/TopicParser';
import {TopicWrapper} from '../../../src/Utilities/Helpers/Types';
import {TopicInfo} from '../../../dist/Utilities/Helpers/Types';

describe('Unit test for TopicParser', () => {

    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    const defaultFakeSubResource = 'fakeSubResource';
    const defaultTopicPrefix = 'fake/Registry';
    const defaultFakeLicenseId = '1234';
    const defaultFakeFilter = 'oi4_pv';
    const defaultFakeOi4Id = '2/2/2/2';
    const fakeCategory = 'fakeCategory';
    const fakeFilter = 'fakeFilter';
    const defaultFakeTag = 'tag';

    const defaultTopic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}`;

    function getTopicWrapper(topic = defaultTopic) {
        return TopicParser.getTopicWrapperWithCommonInfo(topic);
    }

    it('If the appId is invalid an error is thrown', async () => {
        const topic = `${defaultTopicPrefix}/mymanufacturer.com//1/1/${TopicMethods.GET}/${Resource.MAM}`;
        expect(() => {TopicParser.getTopicWrapperWithCommonInfo(topic);}).toThrowError(`Invalid App id: ${topic}`);
    });

    it('Common information are properly extracted', async () => {
        const wrapper: TopicWrapper = getTopicWrapper(defaultTopic);
        expect(wrapper.topicInfo.topic).toStrictEqual(defaultTopic);
        expect(wrapper.topicInfo.appId).toStrictEqual(defaultFakeAppId);
        expect(wrapper.topicInfo.method).toStrictEqual(TopicMethods.GET);
        expect(wrapper.topicInfo.resource).toStrictEqual(Resource.MAM);
        expect(wrapper.topicInfo.serviceType).toStrictEqual(getServiceType('Registry'));
    });

    it('Pub event info are extracted', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/${fakeCategory}/${fakeFilter}`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.category).toStrictEqual(fakeCategory);
        expect(info.filter).toStrictEqual(fakeFilter);
    });

    function checkAgainstErrorForPubEvent(topic: string, errMsg: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {TopicParser.extractResourceSpecificInfo(wrapper);}).toThrowError(errMsg);
    }

    it('Invalid info for Pub event generate an error', async () => {
        let topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}//${fakeFilter}`;
        checkAgainstErrorForPubEvent(topic, `Invalid category: ${topic}`);

        topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/${fakeCategory}/`;
        checkAgainstErrorForPubEvent(topic, `Invalid filter: ${topic}`);
    });

    it('Malformed Oi4Id generate an error', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}////`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {TopicParser.extractResourceSpecificInfo(wrapper);}).toThrowError(`Malformed Oi4Id : ${topic}`);
    });

    it('Oi4Id is properly extracted', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}/${defaultFakeOi4Id}`;
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.oi4Id).toStrictEqual(defaultFakeOi4Id);
    });

    function checkFilter(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.filter).toStrictEqual(defaultFakeFilter);
    }

    it('In case of config, data and metadata, filter is properly extracted', async () => {
        checkFilter(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
        checkFilter(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
        checkFilter(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}/${defaultFakeFilter}`);
    });

    function checkFilterWithError(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {TopicParser.extractResourceSpecificInfo(wrapper)}).toThrowError('Invalid filter: ');
    }

    it('In case of config, data and metadata, invalid filter generates error', async () => {
        checkFilterWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.CONFIG}/${defaultFakeOi4Id}/`);
        checkFilterWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.DATA}/${defaultFakeOi4Id}/`);
        checkFilterWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.METADATA}/${defaultFakeOi4Id}/`);
    });

    function checkLicense(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.licenseId).toStrictEqual(defaultFakeLicenseId);
    }

    it('In case of config, data and metadata, filter is properly extracted', async () => {
        checkLicense(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.LICENSE}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`);
        checkLicense(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.LICENSE_TEXT}/${defaultFakeOi4Id}/${defaultFakeLicenseId}`);
    });

    function checkLicenseWithError(topic: string) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        expect(() => {TopicParser.extractResourceSpecificInfo(wrapper)}).toThrowError('Invalid licenseId: ');
    }

    it('In case of config, data and metadata, invalid filter generates error', async () => {
        checkLicenseWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.LICENSE}/${defaultFakeOi4Id}/`);
        checkLicenseWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.LICENSE_TEXT}/${defaultFakeOi4Id}/`);
    });

    function checkList(topic: string, withTag = false) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        const info: TopicInfo = TopicParser.extractResourceSpecificInfo(wrapper);
        expect(info.subResource).toStrictEqual(defaultFakeSubResource);
        if(withTag) {
            expect(info.filter).toStrictEqual(`${defaultFakeSubResource}/${defaultFakeTag}`);
            expect(info.tag).toStrictEqual(defaultFakeTag);
        } else {
            expect(info.filter).toStrictEqual(defaultFakeSubResource);
        }
    }

    it('In case of publicationList and subscriptionList, subresource and filter are properly extracted', async () => {
        checkList(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.PUBLICATION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}`);
        checkList(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.SUBSCRIPTION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}`);

        checkList(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.PUBLICATION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}/${defaultFakeTag}`, true);
        checkList(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.SUBSCRIPTION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}/${defaultFakeTag}`, true);
    });

    function checkListWithError(topic: string, withTag = false) {
        const wrapper: TopicWrapper = getTopicWrapper(topic);
        if(withTag) {
            expect(() => {TopicParser.extractResourceSpecificInfo(wrapper)}).toThrowError('Invalid tag: ');
        } else {
            expect(() => {TopicParser.extractResourceSpecificInfo(wrapper)}).toThrowError('Invalid subresource: ');
        }
    }

    it('In case of publicationList and subscriptionList, subresource and filter are properly extracted', async () => {
        checkListWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.PUBLICATION_LIST}/${defaultFakeOi4Id}/`);
        checkListWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.SUBSCRIPTION_LIST}/${defaultFakeOi4Id}/`);

        checkListWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.PUBLICATION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}/`, true);
        checkListWithError(`${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.SUBSCRIPTION_LIST}/${defaultFakeOi4Id}/${defaultFakeSubResource}/`, true);
    });

});
