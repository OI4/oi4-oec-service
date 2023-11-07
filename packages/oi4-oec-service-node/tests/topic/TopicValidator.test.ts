import {TopicInfo, TopicValidator} from '../../src';
import {TopicWrapper} from '@oi4/oi4-oec-service-node';
import {Methods, Resources, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-model';

describe('Unit test for TopicParser', () => {

    const oi4Id = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');
    const defaultTopicInfo: TopicInfo = new TopicInfo(ServiceTypes.REGISTRY, oi4Id, Methods.GET, Resources.MAM, oi4Id);

    const defaultTopicWrapper: TopicWrapper = {
        topicArray: ['', ''],
        topicInfo: defaultTopicInfo
    };

    it('Wrong topic structures are recognized', async () => {
        defaultTopicWrapper.topicArray = ['', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeTruthy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeTruthy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeTruthy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeTruthy();
    });

    it('Proper topic structures are recognized', async () => {

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeFalsy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeFalsy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeFalsy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeFalsy();

        defaultTopicWrapper.topicArray = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        expect(TopicValidator.isMalformedTopic(defaultTopicWrapper)).toBeFalsy();
    });

});
