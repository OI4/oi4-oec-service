import {ClientPayloadHelper} from '../../../dist/Utilities/Helpers/ClientPayloadHelper';
import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ValidatedPayload} from '../../../src/Utilities/Helpers/Types';
import {EDeviceHealth, IContainerHealth} from '@oi4/oi4-oec-service-model';
import {MockedIContainerStateFactory} from "../../Test-utils/Factories/MockedIContainerStateFactory";

describe('Unit test for MqttMessageProcessor', () => {

        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
        const fakeLogFile = loggerItems.fakeLogFile;
        const clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper(loggerItems.fakeLogger);

        beforeEach(() => {
            //Flush the messages log
            fakeLogFile.splice(0, fakeLogFile.length);
        });

        it('getDefaultHealthStatePayload works', async () => {
            const defaultHealthStatePayload: ValidatedPayload = clientPayloadHelper.getDefaultHealthStatePayload();
            expect(defaultHealthStatePayload.abortSending).toBe(false);
            expect(defaultHealthStatePayload.payload).toStrictEqual([{
                DataSetWriterId: 2,
                Payload: {health: EDeviceHealth.NORMAL_0, healthScore: 100}
            }]);
        });

        it('createHealthStatePayload works', async () => {
            const statePayload: IContainerHealth = clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0);
            expect(statePayload.health).toBe(EDeviceHealth.FAILURE_1);
            expect(statePayload.healthScore).toBe(0);
        });

        it('createDefaultSendResourcePayload works', async () => {
            const mockedIContainerState = MockedIContainerStateFactory.getMockedContainerStateInstance();
            const validatedPayload: ValidatedPayload = clientPayloadHelper.createDefaultSendResourcePayload('oi4Id', mockedIContainerState, 'health', 'oi4Id', 1);
            expect(validatedPayload.abortSending).toBe(false);
            expect(validatedPayload.payload).toStrictEqual([{
                DataSetWriterId: 2,
                Payload: {health: EDeviceHealth.NORMAL_0, healthScore: 100}
            }]);
        });

});