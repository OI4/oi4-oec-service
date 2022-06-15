//FIXME is there a way to get rid of this ts-ignore?

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {LoggerItems, MockedLoggerFactory} from './utils/MockedLoggerFactory';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MqttMessageProcessor} from '../src/Utilities/Helpers/MqttMessageProcessor';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MockedIContainerStateFactory} from './utils/MockedIContainerStateFactory';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MockedOPCUABuilderFactory} from './utils/MockedOPCUABuilderFactory';
import {TopicMethods} from '../src/Utilities/Helpers/Enums';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {Oi4IdManager} from '../src/messagebus/Oi4IdManager';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;

    beforeEach( () => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        Oi4IdManager.resetCurrentOi4Id();
    });

    function getMockedData() {
        return {
            fakeOi4Id: 'forged/mocked/fabricated/counterfait',
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `fake/fictitious/forged/mocked/fabricated/counterfait/${TopicMethods.GET}/mam`,
        }
    }

    function mockBuilder(info: any): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {return Promise.resolve(true)});
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {return Promise.resolve(true)});
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {return Promise.resolve('FakeType');});

        return MockedOPCUABuilderFactory.getMockedOPCUABuilder(info.fakeOi4Id, info.fakeServiceType);
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const mockedData = getMockedData();
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Registry/Fake'
        };

        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(loggerItems.fakeLogger, MockedIContainerStateFactory.getMockedContainerStateInstance(), jest.fn(),jest.fn(),jest.fn());
        await mqttMessageProcessor.processMqttMessage(mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData), mockedData.fakeOi4Id);

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('Saving the oi4Id forged/mocked/fabricated/counterfait');
        expect(Oi4IdManager.fetchCurrentOi4Id()).toBe('forged/mocked/fabricated/counterfait');
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const info = getMockedData();
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Mocked/Fake'
        };

        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(loggerItems.fakeLogger, MockedIContainerStateFactory.getMockedContainerStateInstance(), jest.fn(),jest.fn(),jest.fn());
        await mqttMessageProcessor.processMqttMessage(info.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(info), info.fakeOi4Id);

        expect(fakeLogFile.length).toBe(0);
        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow(Error);
        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

});
