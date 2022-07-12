import {TopicMethods} from '../../../dist/Utilities/Helpers/Enums';
import {getServiceType, Resource} from '@oi4/oi4-oec-service-model';
import {TopicParser} from '../../../dist/Utilities/Helpers/TopicParser';
import {TopicInfo} from '../../../dist/Utilities/Helpers/Types';

describe('Unit test for TopicParser', () => {

    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    //const defaultFakeSubResource = 'fakeSubResource';
    const defaultTopicPrefix = 'fake/Registry';
    //const defaultFakeLicenseId = '1234';
    //const defaultFakeFilter = 'oi4_pv';
    //const defaultFakeOi4Id = '2/2/2/2';
    const fakeCategory = 'fakeCategory';
    const fakeFilter = 'fakeFilter';
    //const defaultFakeTag = 'tag';

    it('If the appId is invalid an error is thrown', async () => {
        const topic = `${defaultTopicPrefix}/mymanufacturer.com//1/1/${TopicMethods.GET}/${Resource.MAM}`;
        expect(() => {TopicParser.parseTopic(topic);}).toThrowError(`Invalid App id: ${topic}`);
    });

    it('Common information are properly extractex', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}`;
        const info: TopicInfo = TopicParser.parseTopic(topic);
        expect(info.topic).toStrictEqual(topic);
        expect(info.appId).toStrictEqual(defaultFakeAppId);
        expect(info.method).toStrictEqual(TopicMethods.GET);
        expect(info.resource).toStrictEqual(Resource.MAM);
        expect(info.serviceType).toStrictEqual(getServiceType('Registry'));
    });

    it('Malformed topic strings generate an error', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.GET}/${Resource.MAM}//////////////////`;
        expect(() => {TopicParser.parseTopic(topic);}).toThrowError(`Invalid topic string structure ${topic}`);
    });

    it('Pub event info are extracted', async () => {
        const topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/${fakeCategory}/${fakeFilter}`;
        const info: TopicInfo = TopicParser.parseTopic(topic);
        expect(info.category).toStrictEqual(fakeCategory);
        expect(info.filter).toStrictEqual(fakeFilter);
    });

    it('Invaldi info for Pub event generate an error', async () => {
        let topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}//${fakeFilter}`;
        expect(() => {TopicParser.parseTopic(topic);}).toThrowError(`Invalid category: ${topic}`);
        topic = `${defaultTopicPrefix}/${defaultFakeAppId}/${TopicMethods.PUB}/${Resource.EVENT}/${fakeCategory}/`;
        expect(() => {TopicParser.parseTopic(topic);}).toThrowError(`Invalid filter: ${topic}`);
    });

});
