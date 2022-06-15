import {ClientPayloadHelper} from '../../../dist/Utilities/Helpers/ClientPayloadHelper';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ValidatedPayload} from '../../../src/Utilities/Helpers/Types';
import {EDeviceHealth, EPublicationListExplicit, IContainerHealth, IContainerState} from '@oi4/oi4-oec-service-model';
import {MockedIContainerStateFactory} from '../../Test-utils/Factories/MockedIContainerStateFactory';


describe('Unit test for ClientPayloadHelper', () => {

    const default_payload = [{
        DataSetWriterId: 2,
        Payload: {health: EDeviceHealth.NORMAL_0, healthScore: 100}
    }];

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile = loggerItems.fakeLogFile;

    let clientPayloadHelper: ClientPayloadHelper;
    let mockedIContainerState: IContainerState;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        clientPayloadHelper = new ClientPayloadHelper(loggerItems.fakeLogger);
        mockedIContainerState = MockedIContainerStateFactory.getMockedContainerStateInstance()
    });

    it('getDefaultHealthStatePayload works', async () => {
        const defaultHealthStatePayload: ValidatedPayload = clientPayloadHelper.getDefaultHealthStatePayload();
        expect(defaultHealthStatePayload.abortSending).toBe(false);
        expect(defaultHealthStatePayload.payload).toStrictEqual(default_payload);
    });

    it('createHealthStatePayload works', async () => {
        const statePayload: IContainerHealth = clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0);
        expect(statePayload.health).toBe(EDeviceHealth.FAILURE_1);
        expect(statePayload.healthScore).toBe(0);
    });

    it('createDefaultSendResourcePayload works when filter === oi4Id', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('oi4Id', mockedIContainerState, 'health', 'oi4Id', 1);
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual(default_payload);
    });

    it('createDefaultSendResourcePayload works when filter !== oi4Id and dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('whatever', mockedIContainerState, 'health', 'oi4Id', NaN);
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
    });

    it('createDefaultSendResourcePayload works when filter !== oi4Id and resource === Object.keys(CDataSetWriterIdLookup)[dataSetWriterIdFilter - 1]', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('whatever', mockedIContainerState, 'health', 'oi4Id', 2);
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual(default_payload);
    });

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'whatever', 'whatever');
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
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

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = {components: [{licAddText: 'fakeLicence', component: 'fakeComponent', licAuthors: ['John Doe, Mary Poppins, Bilbo Baggins, John Rambo, Homer Simpson']}]};
        const expectedPayload = createMockedPayloadWithSubresource('1',2, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    });

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter !== CDataSetWriterIdLookup[resource]', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'licence');
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('DataSetWriterId does not fit to licence Resource');
    });

    it('createLicenseSendResourcePayload works when dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, '1', NaN, 'health');
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = {components: [{licAddText: 'fakeLicence', component: 'fakeComponent', licAuthors: ['John Doe, Mary Poppins, Bilbo Baggins, John Rambo, Homer Simpson']}]};
        const expectedPayload = createMockedPayloadWithSubresource('1',3, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    });

    function createPublicationMockedPayload (resource: string, tag: string, datasetWriterId: number, oi4Id: string, active: boolean, explicit: string, interval: number, precisions: number, config: string) {
        return {
            resource: resource,
            tag: tag,
            DataSetWriterId: datasetWriterId,
            oi4Identifier: oi4Id,
            active: active,
            explicit: explicit,
            interval: interval,
            precisions: precisions,
            config: config,
        }
    }

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload('fakeResource', 'fakeTag', -1, 'fakeOi4Identifier', false, EPublicationListExplicit.EXPL_OFF_0, -1, -1, 'NONE_0');
        const expectedPayload = createMockedPayloadWithSubresource('fakeResource',2, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    });

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is not NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'health');
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload('fakeResource', 'fakeTag', -1, 'fakeOi4Identifier', false, EPublicationListExplicit.EXPL_OFF_0, -1, -1, 'NONE_0');
        const expectedPayload = createMockedPayloadWithSubresource('fakeResource',2, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    });

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is not NaN but dataSetWriterId does not match the resource', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'oi4Id',2, 'license');
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('DataSetWriterId does not fit to license Resource');
    });

    it('createPublicationListSendResourcePayload works when dataSetWriterIdFilter is NaN', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, 'fakeResource', NaN, 'health');
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload('fakeResource', 'fakeTag', -1, 'fakeOi4Identifier', false, EPublicationListExplicit.EXPL_OFF_0, -1, -1, 'NONE_0');
        const expectedPayload = createMockedPayloadWithSubresource('fakeResource',2, expectedInnerPayload);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    });

});