import {LoggerItems, MockedLoggerFactory} from '../testUtils/factories/MockedLoggerFactory';
import {ClientCallbacksHelper} from '../../src';
import mqtt from 'async-mqtt';
import {getOi4App} from '../application/OI4Application.test';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import {Methods, Resources} from '@oi4/oi4-oec-service-model';
import {OI4_NS} from '@oi4/oi4-oec-service-node';
import {ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for ClientCallbackHelper', () => {

    const publish = jest.fn();

    jest.spyOn(mqtt, 'connect').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => {
            return {
                connected: true,
                reconnecting: false,
                publish: publish,
                subscribe: jest.fn(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                on: jest.fn(),
            }
        }
    );

    const mockOi4Application = getOi4App();
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
        expect(publish).toHaveBeenCalled();
        // expect(mockedMqttClient.publish).toHaveBeenCalled();
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
        await clientCallbackHelper.onClientConnectCallback(mockOi4Application); // resources, mockedMqttClient, 'fakePreamble', 'fakeOi4Id', mockedBuilder);
        expect(fakeLogFile.length).toBe(3);
        expect(fakeLogFile[0]).toBe('Connected successfully');
        expect(fakeLogFile[1]).toBe(`Published ${Resources.MAM} Pagination: 0 of 1 on ${OI4_NS}/${ServiceTypes.AGGREGATION}/1/1/1/1/${Methods.PUB}/${Resources.MAM}/test/text/213dq/23kl41o%C3%9Fm%C3%9F132`);
        expect(fakeLogFile[2]).toBe('Published birth message');
    });

});
