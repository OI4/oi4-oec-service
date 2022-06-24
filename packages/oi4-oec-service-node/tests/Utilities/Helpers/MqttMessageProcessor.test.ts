import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MqttMessageProcessor} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {OI4RegistryManager} from '../../../src';
import {setLogger} from "@oi4/oi4-oec-service-logger";

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOi4Id();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData() {
        return {
            fakeOi4Id: 'forged/mocked/fabricated/counterfeit',
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `fake/fictitious/forged/mocked/fabricated/counterfeit/${TopicMethods.GET}/mam`,
        }
    }

    function mockBuilder(info: any): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {
            return Promise.resolve('FakeType');
        });

        return MockedOPCUABuilderFactory.getMockedOPCUABuilder(info.fakeOi4Id, info.fakeServiceType);
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const mockedData = getMockedData();
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${mockedData.fakeOi4Id}`,
        };

        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = mockedData.fakeOi4Id;
        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(applicationResource, jest.fn(), jest.fn(), jest.fn());
        await mqttMessageProcessor.processMqttMessage(mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(mockedData));

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${mockedData.fakeOi4Id}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(mockedData.fakeOi4Id);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const info = getMockedData();
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Mocked/Fake'
        };

        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = info.fakeOi4Id;
        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(applicationResource, jest.fn(), jest.fn(), jest.fn());
        await mqttMessageProcessor.processMqttMessage(info.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(info));

        expect(fakeLogFile.length).toBe(0);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

});
