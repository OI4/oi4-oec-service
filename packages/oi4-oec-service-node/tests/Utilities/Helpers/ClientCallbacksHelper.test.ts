import {LoggerItems, MockedLoggerFactory} from '../../Test-utils/Factories/MockedLoggerFactory';
import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {ClientCallbacksHelper} from '../../../src/Utilities/Helpers/ClientCallbacksHelper';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import mqtt from 'async-mqtt';
import {MockedMqttClientFactory} from '../../Test-utils/Factories/MockedMqttClientFactory';
import {MockedOPCUABuilderFactory} from '../../Test-utils/Factories/MockedOPCUABuilderFactory';
import {IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';

describe('Unit test for ClientCallbackHelper', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const clearLogFile: Function = loggerItems.clearLogFile;
    const logContainsOnly: Function = loggerItems.logContainsOnly;
    const logContains: Function = loggerItems.logContains;
    const getLogSize: Function = loggerItems.getLogSize;

    const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods('fakeOi4Id', 'fakeServiceType');
    const mockedMqttClient: mqtt.AsyncClient = MockedMqttClientFactory.getMockedClientWithDefaultImplementation();
    const clientPayloadHelper: ClientPayloadHelper = new ClientPayloadHelper();

    let clientCallbackHelper: ClientCallbacksHelper;
    let mockedClient: IOI4ApplicationResources;

    beforeEach(() => {
        clearLogFile();
        clientCallbackHelper = new ClientCallbacksHelper(clientPayloadHelper);
        mockedClient = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
    });

    it('onErrorCallback works', async () => {
        const err = new Error('whatever');
        await clientCallbackHelper.onErrorCallback(err);
        expect(logContainsOnly(`Error in mqtt client: ${err}`)).toBeTruthy();
    });

    it('onCloseCallback works', async () => {
        await clientCallbackHelper.onCloseCallback(mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(mockedMqttClient.publish).toHaveBeenCalled();
        expect(logContainsOnly('Connection to mqtt broker closed')).toBeTruthy();
    });

    it('onDisconnectCallback works', async () => {
        await clientCallbackHelper.onDisconnectCallback();
        expect(logContainsOnly('Disconnected from mqtt broker')).toBeTruthy();
    });

    it('onReconnectCallback works', async () => {
        await clientCallbackHelper.onReconnectCallback();
        expect(logContainsOnly('Reconnecting to mqtt broker')).toBeTruthy();
    });

    it('onClientConnectCallback works', async () => {
        await clientCallbackHelper.onClientConnectCallback(mockedClient, mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(logContains('Connected successfully')).toBeTruthy();
        expect(logContains('Published birth message on fakePreamble/pub/mam/fakeOi4Id')).toBeTruthy();
        expect(getLogSize()).toBe(2);
    });

});
