import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../../../src/Utilities/Helpers/ClientCallbacksHelper';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import mqtt from 'async-mqtt';
import {MockedMqttClientFactory} from '../../Test-utils/Factories/MockedMqttClientFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {ESyslogEventFilter, IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {initializeLogger} from "@oi4/oi4-oec-service-logger";

describe('Unit test for ClientCallbackHelper', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile = loggerItems.fakeLogFile;

    const mockedBuilder = MockedOPCUABuilderFactory.getMockedOPCUABuilder('fakeOi4Id', 'fakeServiceType');
    const mockedMqttClient: mqtt.AsyncClient = MockedMqttClientFactory.getMockedClientWithDefaultImplementation();
    const clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper();

    let clientCallbackHelper: ClientCallbacksHelper;
    let mockedClient: IOI4ApplicationResources;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        clientCallbackHelper = new ClientCallbacksHelper(clientPayloadHelper);
        mockedClient = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
        initializeLogger(true, 'Registry-BusProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, undefined, undefined, undefined);
    });

    function checkLogEntries(size: number, messages: string[]) {
        expect(fakeLogFile.length).toBe(size);
        expect(fakeLogFile).toStrictEqual(messages);
    }

    function checkLogEntry(msg: string) {
        checkLogEntries(1, [msg]);
    }

    it('onErrorCallback works', async () => {
        const err = new Error('whatever');
        await clientCallbackHelper.onErrorCallback(err);
        checkLogEntry(`Error in mqtt client: ${err}`);
    });

    it('onCloseCallback works', async () => {
        mockedClient.brokerState = true;

        await clientCallbackHelper.onCloseCallback(mockedClient, mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(mockedMqttClient.publish).toHaveBeenCalled();
        expect(mockedClient.brokerState).toBe(false);
        checkLogEntry('Connection to mqtt broker closed');
    });

    it('onDisconnectCallback works', async () => {
        mockedClient.brokerState = true;

        await clientCallbackHelper.onDisconnectCallback(mockedClient);
        expect(mockedClient.brokerState).toBe(false);
        checkLogEntry('Disconnected from mqtt broker');
    });

    it('onReconnectCallback works', async () => {
        mockedClient.brokerState = true;

        await clientCallbackHelper.onReconnectCallback(mockedClient);
        expect(mockedClient.brokerState).toBe(false);
        checkLogEntry('Reconnecting to mqtt broker');
    });

    it('onClientConnectCallback works', async () => {
        mockedClient.brokerState = false;

        await clientCallbackHelper.onClientConnectCallback(mockedClient, mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(mockedClient.brokerState).toBe(true);
        checkLogEntries(2, ['Connected successfully', 'Published Birthmessage on fakePreamble/pub/mam/fakeOi4Id']);
    });

});
