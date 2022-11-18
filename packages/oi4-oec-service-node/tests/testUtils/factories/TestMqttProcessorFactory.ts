import { MqttMessageProcessor } from '../../../src';
import {Methods} from '@oi4/oi4-oec-service-model';

export type ProcessorAndMockedData = {
    processor: MqttMessageProcessor;
    mockedData: {
        fakeOi4Id: string;
        fakeServiceType: string;
        fakeTopic: string;
    };
}

/**
 * This class is basically a shortcut for getting the MqttMessageProcessor we want to test (or we need for testing other components)
 */
export class TestMqttProcessorFactory {

    public static getMqttMessageProcessor(appId: string, topicPrefix: string): any {
        // const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        // applicationResource.oi4Id = appId;
        return {
            processor: new MqttMessageProcessor(),
            mockedData: {
                oi4Id: appId,
                serviceType: 'fakeServiceType',
                topic: `${topicPrefix}/${appId}/${Methods.GET}/mam`,
            },
        }
    }

}
