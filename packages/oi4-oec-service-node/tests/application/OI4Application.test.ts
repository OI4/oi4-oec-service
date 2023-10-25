import {MockOI4MessageBus} from '../testUtils/factories/MockOI4MessageBus';
import {EOPCUAStatusCode, IOPCUANetworkMessage, Methods, Resources, StatusEvent} from '@oi4/oi4-oec-service-model';
import {IOI4Application, MqttSettings, OI4Application, oi4Namespace} from '../../src';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {MockOI4ApplicationResources} from '../testUtils/factories/MockOI4ApplicationResources';

/********************************
 * Test variables and constants *
 ********************************/
const messageBusMock = new MockOI4MessageBus();
//const appId = new Oi4Identifier('1', '1', '1', '1');

const oi4ApplicationResources = new MockOI4ApplicationResources();
let oi4Application: IOI4Application;

const publishMock = jest.spyOn(MockOI4MessageBus.prototype, 'publish');

/********************************
 * Test functions and factories *
 ********************************/
export function getOi4Application(): IOI4Application {
    const mqttOpts: MqttSettings = {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };

    return OI4Application.builder()
        .withApplicationResources(oi4ApplicationResources)
        .withMqttSettings(mqttOpts)
        .withMessageBus(messageBusMock)
        .build();
}

describe('OI4MessageBus test', () => {

    beforeAll(() => {
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function) => {
            return cb();
        });
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    beforeEach(() => {
        oi4Application = getOi4Application();

        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();

        publishMock.mockReset();
        publishMock.mockClear();
    });

    afterAll(() => {
        jest.resetModules();
    });

    it('should send resource with valid filter', async () => {
        let actualTopic: string;
        let actualPayload;
        publishMock.mockImplementation((topic: string, networkMessage: IOPCUANetworkMessage) => {
            actualTopic = topic;
            actualPayload = networkMessage?.Messages[0]?.Payload;
            return Promise.resolve(undefined);
        });

        await oi4Application.sendResource(Resources.HEALTH, '', oi4ApplicationResources.mam.getOI4Id(), '1', 1, 1);
        expect(publishMock).toBeCalledTimes(1);
        expect(actualTopic).toBe(`${oi4Namespace}/${oi4ApplicationResources.mam.getServiceType()}/${oi4ApplicationResources.oi4Id}/${Methods.PUB}/${Resources.HEALTH}/${oi4ApplicationResources.mam.getOI4Id().toString()}/1`);
        expect(actualPayload).toBeDefined();
        expect(actualPayload).toMatchObject(oi4ApplicationResources.health);
    });

    it('should send status', async () => {
        const status: StatusEvent = new StatusEvent(EOPCUAStatusCode.Good, 'allGood');

        const mock = jest.spyOn(MockOI4MessageBus.prototype, 'publish');
        mock.mockImplementation((topic: string, networkMessage: IOPCUANetworkMessage) => {
            expect(topic).toBe(`${oi4Namespace}/${oi4ApplicationResources.mam.getServiceType()}/${oi4ApplicationResources.oi4Id}/${Methods.PUB}/${Resources.EVENT}/Status/${encodeURI(`${oi4ApplicationResources.mam.getServiceType()}/${oi4ApplicationResources.oi4Id}`)}`)
            expect(networkMessage).toBeDefined();
            expect(networkMessage.Messages[0]).toBeDefined()
            expect(networkMessage.Messages[0].Payload).toMatchObject(status);
            return Promise.resolve(undefined);
        });

        await oi4Application.sendEventStatus(status, oi4ApplicationResources.oi4Id);
        expect(mock).toBeCalledTimes(1);
    });
});
