import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../../../src/Utilities/Helpers/ClientCallbacksHelper';
//import {IContainerState} from '@oi4/oi4-oec-service-model';
//import {MockedIContainerStateFactory} from '../../Test-utils/Factories/MockedIContainerStateFactory';

describe('Unit test for ClientCallbackHelper', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile = loggerItems.fakeLogFile;

    const clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper(loggerItems.fakeLogger);

    let clientCallbackHelper: ClientCallbacksHelper;
    //let mockedIContainerState: IContainerState;[[Prototype]] = Object

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        clientCallbackHelper = new ClientCallbacksHelper(clientPayloadHelper, loggerItems.fakeLogger);
        //mockedIContainerState = MockedIContainerStateFactory.getMockedContainerStateInstance()
    });

    function checkLog(msg: string) {
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(msg);
    }

    it('onErrorCallback works', async () => {
        const err = new Error('whatever');
        await clientCallbackHelper.onErrorCallback(err);
        checkLog(`Error in mqtt client: ${err}`);
    });

});