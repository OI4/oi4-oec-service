import {LoggerItems, MockedLoggerFactory} from './utils/mockedLoggerFactory';
import {MqttMessageProcessor} from '../dist/Utilities/Helpers/MqttMessageProcessor';

describe('Unit test for MqttMessageProcessor', () => {

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
        const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(loggerItems.fakeLogger, jest.fn(), jest.fn(),jest.fn(),jest.fn());
    });

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {

    });

});
