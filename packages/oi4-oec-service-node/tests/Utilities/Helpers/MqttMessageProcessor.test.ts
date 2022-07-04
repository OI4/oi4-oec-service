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
    const defaultEmitter: EventEmitter = new EventEmitter();
    const defaultFakeOi4Id = 'mymanufacturer.com/1/1/1';
    const defaultFilter = 'oi4_pv';

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
            fakeTopic: `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/mam/${defaultFilter}`,
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

    function getMqttProcessorAndMockedData(mockedSendData: Function, emitter: EventEmitter = defaultEmitter, sendMetaData: Function = jest.fn()): any {
        const mockedData = getMockedData();
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeOi4Id;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendData, emitter),
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

    async function processMessage(mockedSendMessage: Function, fakeTopic: string, resource: string, emitter: EventEmitter = defaultEmitter, sendMetaData: Function = jest.fn()) {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: DataSetClassIds[resource],
            PublisherId: `Registry/${defaultFakeOi4Id}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(mockedSendMessage, emitter, sendMetaData);
        processorAndMockedData.mockedData.fakeTopic = fakeTopic;
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));
    }

    async function checkResultGet(resource: string, fakeTopic: string, filter: string = undefined, emitter: EventEmitter = defaultEmitter) {
        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resource, emitter);
        expect(mockedSendMessage).toHaveBeenCalledWith(resource, undefined, undefined, filter, 0 , 0);
    }

    it('extract topic info works - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set e Del for referenceDesignation basically do nothing
    });

    it('extract topic info works - config', async() => {
        const resourceConfig = 'config';
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${defaultFilter}`;

        await checkResultGet(resourceConfig, fakeTopic, defaultFilter);

        const mockedSendMessage = jest.fn();
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter);

        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {origin: defaultFakeOi4Id, number: 0, description: undefined});
        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, defaultFilter);
        expect(fakeLogFile[1]).toBe(`Added ${defaultFilter} to config group`);
    });

    it('extract topic info works - data', async () => {
        const resourceConfig = 'data';
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${defaultFilter}`;

        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter);
        expect(spiedEmit).toHaveBeenCalledWith('getData', {topic: fakeTopic, message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}});

        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter);
        expect(fakeLogFile[0]).toBe(`Added ${defaultFilter} to dataLookup`);
    });

    it('extract topic info works - metadata', async () => {
        const resourceConfig = 'METADATA';
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${defaultFilter}`;

        const sendMetaData: Function = jest.fn();
        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, sendMetaData);

        expect(sendMetaData).toHaveBeenCalledWith(defaultFilter);

        //set metadata basically does nothing
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        const resourceConfig = 'METADATA';
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}//`;

        try {
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn());
        } catch(err: any) {
            expect(err.message).toBe(`Missing Oi4 Identifier: ${fakeTopic}`);
        }
    });

    async function testAgainstResource(resourceConfig: string) {
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${defaultFilter}/1234`;

        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, undefined, defaultFilter, 0, 0);
    }

    it('extract topic info works - license and licenseText', async () => {
        await testAgainstResource('license');
        await testAgainstResource('licenseText');
    });

    async function testErrorCaseAgainstResource(resourceConfig: string) {
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/license///`;

        try {
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn())
        } catch(err: any) {
            expect(err.message).toBe(`Missing Oi4 Identifier or License Id: ${fakeTopic}`);
        }
    }

    it('extract topic info - license and licenseText - if filter or licenseId is missing, an error is thrown', async () => {
        await testErrorCaseAgainstResource('license');
        await testErrorCaseAgainstResource('licenseText');
    });

    it('extract topic info works - publicationList', async () => {
        const resourceConfig = 'publicationList';
        const subResource = 'myManufacturer.com/myModel/myProductCode/000-555';
        const fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${subResource}/${defaultFilter}`;

        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, subResource, undefined, 0, 0);

        //set publicationList basically does nothing
    });

    it('extract topic info - publicationList  - if subresource or tag is missing, an error is thrown', async () => {
        const resourceConfig = 'publicationList';
        let subResource = 'myManufacturer.com/myModel//000-555';
        let fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${subResource}/${defaultFilter}`;

        try{
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn());
        } catch(err: any) {
            expect(err.message).toBe(`Subresource has an invalid value: ${subResource}`);
        }

        subResource = 'myManufacturer.com/myModel/myProductCode/000-555';
        fakeTopic = `fake/fictitious/${defaultFakeOi4Id}/${TopicMethods.GET}/${resourceConfig}/${subResource}//`;

        try{
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn());
        } catch(err: any) {
            expect(err.message).toBe(`Missing Tag: ${fakeTopic}`);
        }
    });

});
