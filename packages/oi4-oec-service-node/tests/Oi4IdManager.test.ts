//FIXME get rid of this ignore as soon as possible.

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {Oi4IdManager} from '../src/messagebus/Oi4IdManager';

describe('Unit test for Oi4IdManager.test', () => {

    it('The Oi4IdManager works', async () => {

        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow(Error);
        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow('Currently there is no oi4Id saved.');

        Oi4IdManager.saveCurrentOi4Id('123');
        expect(Oi4IdManager.fetchCurrentOi4Id()).toBe('123');

        Oi4IdManager.resetCurrentOi4Id();
        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow(Error);
        expect(() => Oi4IdManager.fetchCurrentOi4Id()).toThrow('Currently there is no oi4Id saved.');

    });

});
