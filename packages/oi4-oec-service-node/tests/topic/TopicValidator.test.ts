import {TopicInfo, TopicValidator, TopicMethods} from '../../src';
import {TopicWrapper} from '@oi4/oi4-oec-service-node';
import {Resources} from '@oi4/oi4-oec-service-model';
import {Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for TopicParser', () => {

    const defaultTopicInfo: TopicInfo = {
        topic: '',
        appId: new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber'),
        method: TopicMethods.GET,
        resource: Resources.MAM,
        oi4Id: new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber'),
        category: '',
        serviceType: ServiceTypes.REGISTRY,
        tag: '',
        filter: '',
        licenseId: '',
        source: ''
    }

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
