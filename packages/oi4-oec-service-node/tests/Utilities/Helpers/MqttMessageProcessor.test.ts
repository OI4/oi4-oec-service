import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MqttMessageProcessor} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {OI4RegistryManager} from '../../../src';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData(fakeOi4Id: string) {
        return {
            fakeOi4Id: fakeOi4Id,
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `fake/fictitious/${fakeOi4Id}/${TopicMethods.GET}/mam/oi4_pv`,
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

    function getMqttProcessorAndMockedData(fakeOi4Id: string, mockedSendData: Function): any {
        const mockedData = getMockedData(fakeOi4Id);
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = mockedData.fakeOi4Id;
        return {
            processor: new MqttMessageProcessor(applicationResource, jest.fn(), mockedSendData, new EventEmitter()),
            mockedData: mockedData,
        }
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const fakeOi4Id = 'mymanufacturer.com/1/1/1';
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${fakeOi4Id}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(fakeOi4Id, jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${processorAndMockedData.mockedData.fakeOi4Id}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(processorAndMockedData.mockedData.fakeOi4Id);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const fakeOi4Id = 'mymanufacturer.com/1/1/1';
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Mocked/Fake'
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(fakeOi4Id, jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(0);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    async function processMessageAndReturnMockedSendData(fakeOi4Id: string, fakeTopic: string) {
        const fakeSendData = jest.fn();
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${fakeOi4Id}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(fakeOi4Id, fakeSendData);
        processorAndMockedData.mockedData.fakeTopic = fakeTopic;
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));
        return fakeSendData;
    }

    it('extract topic info works', async () => {
        const fakeOi4Id = 'mymanufacturer.com/1/1/1';
        const fakeTopic = `fake/fictitious/${fakeOi4Id}/${TopicMethods.GET}/mam/oi4_pv`;
        const fakeSendData = await processMessageAndReturnMockedSendData(fakeOi4Id, fakeTopic);

        expect(fakeSendData.mock.calls[0][0]).toBe('mam');
        expect(fakeSendData.mock.calls[0][3]).toBe('oi4_pv');
        expect(fakeSendData.mock.calls[0][4]).toBe(0);
        expect(fakeSendData.mock.calls[0][5]).toBe(0);
    });

});
