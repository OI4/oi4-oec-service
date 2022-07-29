import {OI4RegistryManager} from '../../src';
import {IOPCUANetworkMessage, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import {initializeLogger} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter} from '@oi4/oi4-oec-service-model';

const defaultOI4Id = new Oi4Identifier('a','b','c','d');
const parsedMessage: IOPCUANetworkMessage = {
    MessageId: '',
    MessageType: undefined,
    PublisherId: `${ServiceTypes.REGISTRY}/${defaultOI4Id.toString()}`,
    DataSetClassId: undefined,
    Messages: [],
}

describe('Unit test for OI4RegistryManager', () => {

    beforeEach(() => {
        const level = process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter;
        initializeLogger(true, 'HereIam', level, level, undefined, ServiceTypes.AGGREGATION);
        OI4RegistryManager.resetOI4RegistryManager();
        OI4RegistryManager.getEmitter().removeAllListeners();
    });

    it('The OI4RegistryManager works', async () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');

        await OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(OI4RegistryManager.getOi4Id()).toStrictEqual(defaultOI4Id);

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
        expect(callback).toBeCalledWith(undefined, defaultOI4Id);

        const newOI4ID = new Oi4Identifier('4','5','6','7');
        parsedMessage.PublisherId = `Registry/${newOI4ID.toString()}`;
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(callback).toBeCalledTimes(2);
        expect(callback).toBeCalledWith(defaultOI4Id, newOI4ID);
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
        expect(() => OI4RegistryManager.checkForOi4Registry(parsedMessage));
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

});
