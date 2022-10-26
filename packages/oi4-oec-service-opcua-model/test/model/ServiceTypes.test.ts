import {ServiceTypes} from '../../src';
import {getServiceType} from '../../src';

describe('Unit test for ServiceTypes', () => {

    it('Check getServiceType', () => {
        expect(getServiceType(ServiceTypes.REGISTRY)).toBe(ServiceTypes.REGISTRY);
        expect(getServiceType(ServiceTypes.OT_CONNECTOR)).toBe(ServiceTypes.OT_CONNECTOR);
        expect(getServiceType(ServiceTypes.UTILITY)).toBe(ServiceTypes.UTILITY);
        expect(getServiceType(ServiceTypes.PERSISTENCE)).toBe(ServiceTypes.PERSISTENCE);
        expect(getServiceType(ServiceTypes.AGGREGATION)).toBe(ServiceTypes.AGGREGATION);
        expect(getServiceType(ServiceTypes.OOC_CONNECTOR)).toBe(ServiceTypes.OOC_CONNECTOR);
        expect(getServiceType(ServiceTypes.IT_CONNECTOR)).toBe(ServiceTypes.IT_CONNECTOR);
    });

    it('Check error is thrown for invalid service type string', () => {
        expect(() => getServiceType('abc')).toThrowError('Unknown service type: abc');
        expect(() => getServiceType('')).toThrowError('Unknown service type: ');
        expect(() => getServiceType(undefined)).toThrowError('Unknown service type: ');
    })
});
