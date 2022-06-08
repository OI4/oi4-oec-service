import {LoggerItems, MockedLoggerFactory} from './utils/MockedLoggerFactory';
import {IContainerState} from '@oi4/oi4-oec-service-model';
import {MqttMessageProcessor} from '../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedIContainerStateFactory} from './utils/MockedIContainerStateFactory';

describe('Unit test for MqttMessageProcessor', () => {

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
        const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
        const containerState: IContainerState = MockedIContainerStateFactory.getMockedContainerStateInstance();
        jest.mocked<IContainerState>(containerState);
        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(loggerItems.fakeLogger, containerState, jest.fn(),jest.fn(),jest.fn());

        expect(fakeLogFile.length).toBe(0);
    });

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {

    });

});
