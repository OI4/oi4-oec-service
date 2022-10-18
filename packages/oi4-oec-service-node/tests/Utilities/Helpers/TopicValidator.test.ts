import {TopicValidator} from '../../../src/Utilities/Helpers/TopicValidator';
import {TopicInfo} from '../../../src';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {TopicWrapper} from '@oi4/oi4-oec-service-node';
import {Resource} from '@oi4/oi4-oec-service-model';
import {Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for TopicParser', () => {

    const defaultTopicInfo: TopicInfo = {
        topic: '',
        appId: new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber'),
        method: TopicMethods.GET,
        resource: Resource.MAM,
        oi4Id: new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber'),
        category: '',
        serviceType: ServiceTypes.REGISTRY,
        tag: '',
        filter: '',
        licenseId: '',
        subResource: ''
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
