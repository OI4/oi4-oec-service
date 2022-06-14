import {ClientPayloadHelper} from '../../../dist/Utilities/Helpers/ClientPayloadHelper';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ValidatedPayload} from '../../../src/Utilities/Helpers/Types';
import {EDeviceHealth, IContainerHealth, IContainerState} from '@oi4/oi4-oec-service-model';
import {MockedIContainerStateFactory} from '../../Test-utils/Factories/MockedIContainerStateFactory';


describe('Unit test for MqttMessageProcessor', () => {

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

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is not undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'key', 'health');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual([{
            DataSetWriterId: 2,
            Payload: {licenseText: 'fakeKey'}
        }]);


    });


});