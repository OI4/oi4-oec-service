import {ServiceTypes} from '../src';

describe('Unit test for ServiceTypes', () => {

    it('Check amount and values of ServiceTypes', async () => {
        expect(Object.keys(ServiceTypes).length).toBe(7);
        expect(ServiceTypes.REGISTRY).toBe('Registry');
        expect(ServiceTypes.OT_CONNECTOR).toBe('OTConnector');
        expect(ServiceTypes.UTILITY).toBe('Utility');
        expect(ServiceTypes.PERSISTENCE).toBe('Persistence');
        expect(ServiceTypes.AGGREGATION).toBe('Aggregation');
        expect(ServiceTypes.OOC_CONNECTOR).toBe('OOCConnector');
        expect(ServiceTypes.IT_CONNECTOR).toBe('ITConnector');
    });
});
