import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ValidatedPayload} from '../../../src/Utilities/Helpers/Types';
import {EDeviceHealth, IApplicationResources, IContainerHealth} from '@oi4/oi4-oec-service-model';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';


describe('Unit test for ClientPayloadHelper', () => {

    const default_payload = [{
        DataSetWriterId: 2,
        Payload: {health: EDeviceHealth.NORMAL_0, healthScore: 100}
    }];

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile = loggerItems.fakeLogFile;

    let clientPayloadHelper: ClientPayloadHelper;
    let mockedIContainerState: IApplicationResources;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        clientPayloadHelper = new ClientPayloadHelper(loggerItems.fakeLogger);
        mockedIContainerState = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance()
    });

    function checkAgainstDefaultPayload(payload: ValidatedPayload) {
        expect(payload.abortSending).toBe(false);
        expect(payload.payload).toStrictEqual(default_payload);
    }

    it('getDefaultHealthStatePayload works', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.getDefaultHealthStatePayload();
        checkAgainstDefaultPayload(validatedPayload);
    });

    it('createHealthStatePayload works', async () => {
        const statePayload: IContainerHealth = clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0);
        expect(statePayload.health).toBe(EDeviceHealth.FAILURE_1);
        expect(statePayload.healthScore).toBe(0);
    });

    it('createDefaultSendResourcePayload works when filter === oi4Id', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('oi4Id', mockedIContainerState, 'health', 'oi4Id', 1);
        checkAgainstDefaultPayload(validatedPayload);
    });

    function checkForUndefinedPayload(validatedPayload: ValidatedPayload) {
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
    }

    it('createDefaultSendResourcePayload works when filter !== oi4Id and dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('whatever', mockedIContainerState, 'health', 'oi4Id', NaN);
        checkForUndefinedPayload(validatedPayload);
    });

    it('createDefaultSendResourcePayload works when filter !== oi4Id and resource === Object.keys(CDataSetWriterIdLookup)[dataSetWriterIdFilter - 1]', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('whatever', mockedIContainerState, 'health', 'oi4Id', 2);
        checkAgainstDefaultPayload(validatedPayload);
    });

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'whatever', 'whatever');
        checkForUndefinedPayload(validatedPayload);
    });

    function createLicenseMockedPayload(dataSetWriterId: number, payload: any) {
        return [{
            DataSetWriterId: dataSetWriterId,
            Payload: payload
        }];
    };

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is not undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'key', 'health');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual(createLicenseMockedPayload(2, {licenseText: 'fakeKey'}));
    });

    function createMockedPayloadWithSubresource(subResource: string, dataSetWriterId: number, payload: any) {
        return [{
            subResource: subResource,
            Payload: payload,
            DataSetWriterId: dataSetWriterId
        }];
    }

    function checkAgainstLicensePayload(validatedPayload: ValidatedPayload, dataSetWriterId: number) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = {components: [{licAddText: 'fakeLicence', component: 'fakeComponent', licAuthors: ['John Doe', 'Mary Poppins', 'Bilbo Baggins', 'John Rambo', 'Homer Simpson']}]};
        const expectedPayload = createMockedPayloadWithSubresource('1',dataSetWriterId, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        checkAgainstLicensePayload(validatedPayload, 2);
    });

    function checkForUnfittingDataSetId(validatedPayload: ValidatedPayload) {
        checkForUndefinedPayload(validatedPayload);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('DataSetWriterId does not fit to license Resource');
    }

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter !== CDataSetWriterIdLookup[resource]', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'license');
        checkForUnfittingDataSetId(validatedPayload);
    });

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, '1', NaN, 'health');
        checkAgainstLicensePayload(validatedPayload, 3);
    });

    function createPublicationMockedPayload (resource: string, datasetWriterId: number, oi4Id: string) {
        return {
            DataSetWriterId: datasetWriterId,
            oi4Identifier: oi4Id,
            resource: resource,
        }
    }

    function checkAgainstPublicationPayload(validatedPayload: ValidatedPayload, dataSetWriterId: number) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload('fakeResource', 42, 'fakeOi4Id');
        const expectedPayload = createMockedPayloadWithSubresource('fakeResource',dataSetWriterId, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        checkAgainstPublicationPayload(validatedPayload, 2);
    });

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is not NaN but dataSetWriterId does not match the resource', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'license');
        checkForUnfittingDataSetId(validatedPayload);
    });

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'fakeResource', NaN, 'health');
        checkAgainstPublicationPayload(validatedPayload, 2);
    });

    function createSubscriptionMockedPayload (topicPath: string) {
        return {
            topicPath: topicPath,
        }
    }

    function checkAgainstSubscriptionPayload(validatedPayload: ValidatedPayload, topicPath: string, subresource: string) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createSubscriptionMockedPayload(topicPath);
        const expectedPayload = createMockedPayloadWithSubresource(subresource,2, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createSubscriptionListSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createSubscriptionListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        checkAgainstSubscriptionPayload(validatedPayload, 'fakePath', undefined);
    });

    it('createSubscriptionListSendResourcePayload works when dataSetWriterIdFilter is not NaN and dataSetWriterIdFilter !== CDataSetWriterIdLookup[resource]', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createSubscriptionListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'license');
        checkForUnfittingDataSetId(validatedPayload);
    });

    function checkAgainstConfigPayload(validatedPayload: ValidatedPayload) {
        expect(validatedPayload.abortSending).toBe(false);
        const receivedPayload = validatedPayload.payload[0];
        expect(receivedPayload.subResource).toStrictEqual('fakecontext');
        expect(receivedPayload.DataSetWriterId).toStrictEqual(8);
        expect(receivedPayload.Payload).not.toBe(null);

        expect(receivedPayload.Payload.context.name).not.toBe(null);

        expect(receivedPayload.Payload.logging.auditLevel).not.toBe(null);
        expect(receivedPayload.Payload.logging.logFileSize).not.toBe(null);
        expect(receivedPayload.Payload.logging.logType).not.toBe(null);
        expect(receivedPayload.Payload.logging.name).not.toBe(null);

        expect(receivedPayload.Payload.registry.name).not.toBe(null);
        expect(receivedPayload.Payload.registry.description).not.toBe(null);
        expect(receivedPayload.Payload.registry.developmentMode).not.toBe(null);
        expect(receivedPayload.Payload.registry.showRegistry).not.toBe(null);
    }

    it('createConfigSendResourcePayload works when filter is empty ', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, '', NaN, 'config');
        checkAgainstConfigPayload(validatedPayload);
    });

    it('createConfigSendResourcePayload works when filter is equal to Payload.context.name', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'fakecontext', 42, 'config');
        checkAgainstConfigPayload(validatedPayload);
    });

    it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', NaN, 'config');
        checkForUndefinedPayload(validatedPayload);
    });

    it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is 8', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', 8, 'config');
        checkAgainstConfigPayload(validatedPayload);
    });

    it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is invalid', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', 9, 'config');
        checkForUndefinedPayload(validatedPayload);
    });

});