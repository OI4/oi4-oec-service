import {
    MqttMessageProcessor,
    OnSendMetaData,
    OnSendResource
} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import EventEmitter from 'events';
import {MockedIApplicationResourceFactory} from './MockedIApplicationResourceFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';

export type ProcessorAndMockedData = {
    processor: MqttMessageProcessor;
    mockedData: {
        fakeOi4Id: string;
        fakeServiceType: string;
        fakeTopic: string;
    };
}

export class TestMqttProcessorFactory {

    public static getProcessorAndDataWithCustomEmitter(mockedSendResource: OnSendResource, emitter: EventEmitter, appId: string, topicPrefix: string, sendMetaData: OnSendMetaData = jest.fn()): any {
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = appId;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendResource, emitter),
            mockedData: {
                fakeOi4Id: appId,
                fakeServiceType: 'fakeServiceType',
                fakeTopic: `${topicPrefix}/${appId}/${TopicMethods.GET}/mam`,
            },
        }
    }

    public static getProcessorAndDataWithDefaultEmitter(mockedSendData: OnSendResource, appId: string, topicPrefix: string, sendMetaData: OnSendMetaData = jest.fn()): any {
        return TestMqttProcessorFactory.getProcessorAndDataWithCustomEmitter(mockedSendData, new EventEmitter(), appId, topicPrefix, sendMetaData);
    }

}