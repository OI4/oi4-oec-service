import {LoggerItems, MockedLoggerFactory} from '../testUtils/factories/MockedLoggerFactory';
import {ClientCallbacksHelper} from '../../src';
import mqtt from 'async-mqtt';
import {getOi4Application} from '../application/OI4Application.test';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import {Methods, Resources, oi4Namespace} from '@oi4/oi4-oec-service-model';

describe('Unit test for ClientCallbackHelper', () => {

    const publish = jest.fn();

    jest.spyOn(mqtt, 'connect').mockImplementation(
        () => {
            return {
                connected: true,
                reconnecting: false,
                publish: publish,
                subscribe: jest.fn(),
                on: jest.fn(),
            } as any
        }
    );

    const mockOi4Application = getOi4Application();
    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
    const logContainsOnly: Function = loggerItems.logContainsOnly;

    let clientCallbackHelper: ClientCallbacksHelper;

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        setLogger(loggerItems.fakeLogger);
        clientCallbackHelper = new ClientCallbacksHelper();
        // resources = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
    });

    it('onErrorCallback works', async () => {
        const err = new Error('whatever');
        await clientCallbackHelper.onErrorCallback(err);
        expect(logContainsOnly(`Error in mqtt client: ${err}`)).toBeTruthy();
    });

    it('onCloseCallback works', async () => {
        await clientCallbackHelper.onCloseCallback(mockOi4Application); //mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        // expect(publish).toHaveBeenCalled();
        expect(fakeLogFile.length).toBeGreaterThanOrEqual(2);
        expect(fakeLogFile[fakeLogFile.length - 1]).toBe('Connection to mqtt broker closed');
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
        await clientCallbackHelper.onClientConnectCallback(mockOi4Application); // resources, mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(fakeLogFile.length).toBe(4);
        expect(fakeLogFile[0]).toBe('Connected successfully');
        expect(fakeLogFile[2]).toBe(`Published ${Resources.MAM} Pagination: 0 of 1 on ${oi4Namespace}/${mockOi4Application.serviceType}/${mockOi4Application.oi4Id}/${Methods.PUB}/${Resources.MAM}/${mockOi4Application.oi4Id}`);
        expect(fakeLogFile[3]).toBe('Published birth message');
    });

});
