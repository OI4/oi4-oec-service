import {Oi4Identifier} from '../../src/model/Oi4Identifier';

describe('Unit test for Oi4Identifier', () => {

    it('Check oi4Id from string', async () => {
        const oi4Id = 'acme.com/model/productCode/serialNumber';
        const oi4Identifier = Oi4Identifier.fromString(oi4Id);
        expect(oi4Identifier.manufacturerUri).toBe('acme.com');
        expect(oi4Identifier.model).toBe('model');
        expect(oi4Identifier.productCode).toBe('productCode');
        expect(oi4Identifier.serialNumber).toBe('serialNumber');
        expect(oi4Identifier.toString()).toBe(oi4Id);
    });

    it('Check oi4Id from string with invalid oi4Id', async () => {
        const oi4Id = 'acme.com/model/productCode/serialNumber/invalid';
        expect(() => Oi4Identifier.fromString(oi4Id)).toThrowError(`Invalid OI4 identifier: ${oi4Id}`);
    });

    it('Check throwing error for empty string', async () => {
        expect(() => Oi4Identifier.fromString(undefined)).toThrowError('No OI4 identifier provided');
    });

    it('Check Oi4Identifier used as string', async () => {
        const oi4Identifier = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');
        expect(`${oi4Identifier}`).toBe('acme.com/model/productCode/serialNumber');
    });

    it('Check Oi4Identifier equality', async () => {
        const oi4Identifier1 = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');
        const oi4Identifier2 = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');
        const oi4Identifier3 = new Oi4Identifier('acme.com2', 'model2', 'productCode2', 'serialNumber2');
        expect(oi4Identifier1.equals(oi4Identifier2)).toBe(true);
        expect(oi4Identifier1.equals(oi4Identifier3)).toBe(false);

        expect(oi4Identifier1.equals(undefined)).toBe(false);
    });

    it('Check Oi4Identifier with special characters', ()=> {
        const oi4Identifier1 = new Oi4Identifier('acme.com', 'model 1', 'product&Code ', 'serial+Number');
        const oi4IdentfierString = oi4Identifier1.toString();
        const oi4Identifier2 = Oi4Identifier.fromString(oi4IdentfierString);

        expect(oi4Identifier1.equals(oi4Identifier2)).toBe(true);
    });
});
