import {OI4RegistryManager} from '../../src';
import {IOPCUANetworkMessage} from "@oi4/oi4-oec-service-opcua-model";
import {initializeLogger} from "@oi4/oi4-oec-service-logger";
import {ESyslogEventFilter, ServiceTypes} from "@oi4/oi4-oec-service-model";

const parsedMessage: IOPCUANetworkMessage = {
    MessageId: '',
    MessageType: undefined,
    PublisherId: `${ServiceTypes.REGISTRY}/123`,
    DataSetClassId: undefined,
    Messages: [],
}

describe('Unit test for OI4RegistryManager', () => {

    beforeEach(() => {
        initializeLogger(true, 'HereIam', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, undefined, '', '');
        OI4RegistryManager.resetOI4RegistryManager();
        OI4RegistryManager.getEmitter().removeAllListeners();
    });

    it('The OI4RegistryManager works', async () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');

        await OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(OI4RegistryManager.getOi4Id()).toBe('123');

        OI4RegistryManager.resetOI4RegistryManager();
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('The OI4RegistryManager works with event emitter', () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
        const callback = jest.fn();
        OI4RegistryManager.getEmitter().addListener(OI4RegistryManager.OI4_REGISTRY_CHANGED, callback);

        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(callback).toBeCalledTimes(1);
        expect(callback).toBeCalledWith(undefined, '123');

        parsedMessage.PublisherId = 'Registry/456';
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(callback).toBeCalledTimes(2);
        expect(callback).toBeCalledWith('123', '456');
    });

    it('The OI4RegistryManager ignores invalid publisherId', () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        parsedMessage.PublisherId = undefined;
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);

        parsedMessage.PublisherId = ServiceTypes.REGISTRY;
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');

        parsedMessage.PublisherId = `${ServiceTypes.REGISTRY}/`;
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

});
