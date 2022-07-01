import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {MqttMessageProcessor} from '../../../src/Utilities/Helpers/MqttMessageProcessor';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {OI4RegistryManager} from '../../../src';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';
import {DataSetClassIds} from '@oi4/oi4-oec-service-model';

describe('Unit test for MqttMessageProcessor', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    const defaultFakeOi4Id = 'mymanufacturer.com/1/1/1';
    const defaultEmitter: EventEmitter = new EventEmitter();

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        MockedOPCUABuilderFactory.resetAllMocks();
        OI4RegistryManager.resetOI4RegistryManager();
        setLogger(loggerItems.fakeLogger);
    });

    function getMockedData() {
        return {
            fakeOi4Id: defaultFakeOi4Id,
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/mam/oi4_pv`,
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

        return MockedOPCUABuilderFactory.getMockedOPCUABuilder(defaultFakeOi4Id, info.fakeServiceType);
    }

    function getMqttProcessorAndMockedData(mockedSendData: Function, emitter: EventEmitter = defaultEmitter): any {
        const mockedData = getMockedData();
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeOi4Id;
        return {
            processor: new MqttMessageProcessor(applicationResource, jest.fn(), mockedSendData, emitter),
            mockedData: mockedData,
        }
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${defaultFakeOi4Id}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${defaultFakeOi4Id}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(defaultFakeOi4Id);
    });

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: 'Mocked/Fake'
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(0);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    async function processMessage(mockedSendMessage: Function, fakeTopic: string, resource: string, emitter: EventEmitter = defaultEmitter) {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultFakeOi4Id}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(mockedSendMessage, emitter);
        processorAndMockedData.mockedData.fakeTopic = fakeTopic;
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));
    }

    async function checkResultGet(resource: string, fakeTopic: string, filter: string = undefined, emitter: EventEmitter = defaultEmitter) {
        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resource, emitter);
        expect(mockedSendMessage).toHaveBeenCalledWith(resource, undefined, undefined, filter, 0 , 0);
    }

    it('extract topic info works', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set e Del for referenceDesignation basically do nothing
    });

    it('extract topic info works - config', async() => {
        const resourceConfig = 'config';
        let fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/oi4_pv`;
        await checkResultGet(resourceConfig, fakeTopic, 'oi4_pv');

        const mockedSendMessage = jest.fn();
        const emitter: EventEmitter = new EventEmitter();
        const spiedEmit = jest.spyOn(emitter, 'emit');
        fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.SET}/${resourceConfig}/oi4_pv`;
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, emitter);
        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {origin: defaultFakeOi4Id, number: 0, description: undefined});
        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, 'oi4_pv');
        expect(fakeLogFile[1]).toBe('Added oi4_pv to config group');
    });

    it('extract topic info works - data - get', async () => {
        const resourceConfig = 'data';
        const emitter: EventEmitter = new EventEmitter();
        const spiedEmit = jest.spyOn(emitter, 'emit');
        let fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/oi4_pv`;
        await processMessage(jest.fn(), fakeTopic, resourceConfig, emitter);
        expect(spiedEmit).toHaveBeenCalledWith('getData', {topic: fakeTopic, message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}});

        fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.SET}/${resourceConfig}/oi4_pv`;
        await processMessage(jest.fn(), fakeTopic, resourceConfig, emitter);
        expect(fakeLogFile[0]).toBe('Added oi4_pv to dataLookup');
    });
    
});
