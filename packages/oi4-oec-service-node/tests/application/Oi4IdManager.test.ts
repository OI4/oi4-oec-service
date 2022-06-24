import {OI4IdManager} from '../../src';

describe('Unit test for OI4IdManager.test', () => {

    it('The OI4IdManager works', async () => {

        expect(() => OI4IdManager.fetchCurrentOi4Id()).toThrow(Error);
        expect(() => OI4IdManager.fetchCurrentOi4Id()).toThrow('Currently there is no oi4Id saved.');

        OI4IdManager.saveCurrentOi4Id('123');
        expect(OI4IdManager.fetchCurrentOi4Id()).toBe('123');

        OI4IdManager.resetCurrentOi4Id();
        expect(() => OI4IdManager.fetchCurrentOi4Id()).toThrow(Error);
        expect(() => OI4IdManager.fetchCurrentOi4Id()).toThrow('Currently there is no oi4Id saved.');

    });

});
