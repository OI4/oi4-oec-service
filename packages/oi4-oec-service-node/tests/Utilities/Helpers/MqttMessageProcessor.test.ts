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
    const defaultFakeAppId = 'mymanufacturer.com/1/1/1';
    const defaultFakeOi4Id = '1/1/1/1';
    const defaultLicenseId = '1234';
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
            fakeOi4Id: defaultFakeAppId,
            fakeServiceType: 'fakeServiceType',
            fakeTopic: `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/mam/${defaultFilter}`,
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

        return MockedOPCUABuilderFactory.getMockedOPCUABuilder(defaultFakeAppId, info.fakeServiceType);
    }

    function getMqttProcessorAndMockedData(mockedSendData: Function, emitter: EventEmitter = defaultEmitter, sendMetaData: Function = jest.fn()): any {
        const mockedData = getMockedData();
        const applicationResource = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        applicationResource.oi4Id = defaultFakeAppId;
        return {
            processor: new MqttMessageProcessor(applicationResource, sendMetaData, mockedSendData, emitter),
            mockedData: mockedData,
        }
    }

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {
        const jsonObj = {
            Messages: [{Payload: 'fakePayload'}],
            DataSetClassId: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
            PublisherId: `Registry/${defaultFakeAppId}`,
        };

        const processorAndMockedData = getMqttProcessorAndMockedData(jest.fn());
        await processorAndMockedData.processor.processMqttMessage(processorAndMockedData.mockedData.fakeTopic, Buffer.from(JSON.stringify(jsonObj)), mockBuilder(processorAndMockedData.mockedData));

        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Saved registry OI4 ID: ${defaultFakeAppId}`);
        expect(OI4RegistryManager.getOi4Id()).toBe(defaultFakeAppId);
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
            PublisherId: `Registry/${defaultFakeAppId}`,
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

    it('extract topic info works without Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resource}`;
            await checkResultGet(resource, fakeTopic);
        }

        //Set e Del for referenceDesignation basically do nothing
    });

    it('extract topic info works with Oi4Id - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        for (const resource of resources) {
            const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/${defaultFakeOi4Id}`;
            await checkResultGet(resource, fakeTopic);
        }
    });

    /*
    PROTOTYPE
    async function checkForErrorThrown(errorMsg: string, functionCaller: Function) {
        let errorArrived = false;
        try {
            functionCaller();
        } catch(err: any) {
            expect(err.message).toBe(errorMsg);
            errorArrived = true;
        }

        expect(errorArrived).toBeTruthy();
    }
    */

    it('extract topic info works - if oi4Id is wrong an error is thrown - mam, health, rtLicense, profile, referenceDesignation', async () => {
        const resources = ['mam', 'health', 'rtLicense', 'profile', 'referenceDesignation'];
        let errorArrived = false;

        for (const resource of resources) {
            const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resource}/1//1/1`;
            try {
                await checkResultGet(resource, fakeTopic);
            } catch(err:any) {
                expect(err.message).toBe(`Malformed Oi4Id : ${fakeTopic}`);
                errorArrived = true;
            }

            expect(errorArrived).toBeTruthy();
            errorArrived = false;
        }
    });

    it('extract topic info works - config - get', async() => {
        const resourceConfig = 'config';
        let fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}`;
        await checkResultGet(resourceConfig, fakeTopic);

        fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${defaultFakeOi4Id}`;
        await checkResultGet(resourceConfig, fakeTopic);

        fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFilter}`;
        await checkResultGet(resourceConfig, fakeTopic, defaultFilter);
    });

    it('extract topic info works - config - set', async() => {
        const resourceConfig = 'config';
        const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.SET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFilter}`;

        const mockedSendMessage = jest.fn();
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter);

        expect(spiedEmit).toHaveBeenCalledWith('setConfig', {origin: defaultFakeAppId, number: 0, description: undefined});
        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, defaultFilter);
        expect(fakeLogFile[0]).toBe(`Added ${defaultFilter} to config group`);
    });

    async function checkAgainstError(resourceConfig: string, errorPrefix: string) {
        const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.SET}/${resourceConfig}/1/1/1/1/`;
        let errorArrived = false;

        try {
            await processMessage(jest.fn(), fakeTopic, resourceConfig, new EventEmitter());
        } catch(err:any) {
            expect(err.message).toBe(`${errorPrefix}${fakeTopic}`);
            errorArrived = true;
        }
        expect(errorArrived).toBeTruthy();
    }

    it('extract topic info works - config - if the filter is missing an error is thrown', async() => {
        await checkAgainstError('config', 'Invalid filter: ');
    });

    async function checkAgainstTopicForData(fakeTopic: string) {
        const resourceConfig = 'data';
        const spiedEmit = jest.spyOn(defaultEmitter, 'emit');
        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter);
        expect(spiedEmit).toHaveBeenCalledWith('getData', {topic: fakeTopic, message: {Messages: [{Payload: 'fakePayload'}], PublisherId: 'Registry/mymanufacturer.com/1/1/1'}});
    }

    it('extract topic info works - data - get', async () => {
        await checkAgainstTopicForData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/data`);
        await checkAgainstTopicForData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/data/${defaultFakeOi4Id}`);
        await checkAgainstTopicForData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/data/${defaultFakeOi4Id}/${defaultFilter}`);
    });

    it('extract topic info works - data - set', async () => {
        const resourceConfig = 'data';
        const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.SET}/${resourceConfig}/${defaultFakeOi4Id}/${defaultFilter}`;

        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter);
        expect(fakeLogFile[0]).toBe(`Added ${defaultFilter} to dataLookup`);
    });

    it('extract topic info works - data - if the filter is missing an error is thrown', async() => {
        await checkAgainstError('data', 'Invalid filter: ');
    });

    async function checkAgainstTopicForMetaData(fakeTopic: string, filter: string = undefined) {
        const resourceConfig = 'METADATA';
        const sendMetaData: Function = jest.fn();
        await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, sendMetaData);
        expect(sendMetaData).toHaveBeenCalledWith(filter);
    }

    it('extract topic info works - metadata - get', async () => {
        await checkAgainstTopicForMetaData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/METADATA`);
        await checkAgainstTopicForMetaData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/METADATA/${defaultFakeOi4Id}`);
        await checkAgainstTopicForMetaData(`fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/METADATA/${defaultFakeOi4Id}/${defaultFilter}`, defaultFilter);
        //set metadata basically does nothing
    });

    it('extract topic info - metadata - if filter is missing, an error is thrown', async () => {
        await checkAgainstError('METADATA', 'Invalid filter: ');
    });

    async function testAgainstResourceForLicenseAndLicenseText(resourceConfig: string, fakeTopic: string) {
        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, undefined, undefined, 0, 0);
    }

    it('extract topic info works - license and licenseText - get', async () => {
        const resourceConfigLicense = 'license';
        const resourceConfigLicenseText = 'licenseText';
        const baseFakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}`;

        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicense, `${baseFakeTopic}/${resourceConfigLicense}`);
        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicenseText, `${baseFakeTopic}/${resourceConfigLicenseText}`);
        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicense, `${baseFakeTopic}/${resourceConfigLicense}/${defaultFakeOi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicenseText, `${baseFakeTopic}/${resourceConfigLicenseText}/${defaultFakeOi4Id}`);
        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicense, `${baseFakeTopic}/${resourceConfigLicense}/${defaultFakeOi4Id}/${defaultLicenseId}`);
        await testAgainstResourceForLicenseAndLicenseText(resourceConfigLicenseText, `${baseFakeTopic}/${resourceConfigLicenseText}/${defaultFakeOi4Id}/${defaultLicenseId}`);
    });

    it('extract topic info - license and licenseText - if licenseId is missing, an error is thrown', async () => {
        await checkAgainstError('license', 'Invalid licenseId: ');
        await checkAgainstError('licenseText' ,'Invalid licenseId: ');
    });

    // ------------- RICONTROLLARE DA QUA IN SU, CORREGGERE DA QUA IN GIÚ

    async function testAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {
        const subResource = 'myManufacturer.com/myModel/myProductCode/000-555';
        const fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${subResource}/${defaultFilter}`;

        const mockedSendMessage = jest.fn();
        await processMessage(mockedSendMessage, fakeTopic, resourceConfig, defaultEmitter, jest.fn());

        expect(mockedSendMessage).toHaveBeenCalledWith(resourceConfig, undefined, subResource, undefined, 0, 0);
    }

    it('extract topic info works - publicationList and subscriptionList', async () => {
        await testAgainstResourceForPublicationAndSubscriptionLists('publicationList');
        await testAgainstResourceForPublicationAndSubscriptionLists('subscriptionList');
        //set publicationList and subscriptionList basically does nothing
        //del subscriptionList basically does nothing
    });

    async function testErrorCaseAgainstResourceForPublicationAndSubscriptionLists(resourceConfig: string) {
        let subResource = 'myManufacturer.com/myModel//000-555';
        let fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${subResource}/${defaultFilter}`;

        try{
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn());
        } catch(err: any) {
            expect(err.message).toBe(`Subresource has an invalid value: ${subResource}`);
        }

        subResource = 'myManufacturer.com/myModel/myProductCode/000-555';
        fakeTopic = `fake/fictitious/${defaultFakeAppId}/${TopicMethods.GET}/${resourceConfig}/${subResource}//`;

        try{
            await processMessage(jest.fn(), fakeTopic, resourceConfig, defaultEmitter, jest.fn());
        } catch(err: any) {
            expect(err.message).toBe(`Missing Tag: ${fakeTopic}`);
        }
    }

    it('extract topic info - publicationList and subscriptionList - if subresource or tag is missing, an error is thrown', async () => {
        await testErrorCaseAgainstResourceForPublicationAndSubscriptionLists('publicationList');
        await testErrorCaseAgainstResourceForPublicationAndSubscriptionLists('subscriptionList');
    });

});
