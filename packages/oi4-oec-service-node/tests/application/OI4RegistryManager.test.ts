import {OI4RegistryManager} from '../../src';
import {IOPCUANetworkMessage} from "@oi4/oi4-oec-service-opcua-model";
import {initializeLogger} from "@oi4/oi4-oec-service-logger";
import {ESyslogEventFilter} from "@oi4/oi4-oec-service-model";

const parsedMessage: IOPCUANetworkMessage = {
    MessageId: '',
    MessageType: undefined,
    PublisherId: 'Registry/123',
    DataSetClassId: undefined,
    Messages: [],
}

describe('Unit test for OI4RegistryManager', () => {

    beforeEach(() => {
        initializeLogger(true, 'HereIam', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, undefined, '', '');
        OI4RegistryManager.resetOi4Id();
    });

    it('The OI4RegistryManager works', async () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');

        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(OI4RegistryManager.getOi4Id()).toBe('123');

        OI4RegistryManager.resetOi4Id();
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('The OI4RegistryManager ignores invalid publisherId', async () => {
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        parsedMessage.PublisherId = undefined;
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);

        parsedMessage.PublisherId = 'Registry';
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');

        parsedMessage.PublisherId = 'Registry/';
        OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow(Error);
        expect(() => OI4RegistryManager.getOi4Id()).toThrow('Currently there is no oi4Id saved.');
    });

    it('The OI4RegistryManager works with event emitter', async () => {
        let actualOldId: string;
        let actualNewId: string;
        OI4RegistryManager.getEmitter().addListener(OI4RegistryManager.OI4_REGISTRY_CHANGED, (oldId, newId) => {
            actualOldId = oldId;
            actualNewId = newId;
        });

        await OI4RegistryManager.checkForOi4Registry(parsedMessage);

        expect(actualOldId).toBe(undefined);
        expect(actualNewId).toBe('123');

        parsedMessage.PublisherId = 'Registry/456';
        await OI4RegistryManager.checkForOi4Registry(parsedMessage);
        expect(actualOldId).toBe('123');
        expect(actualNewId).toBe('456');
    });

});
