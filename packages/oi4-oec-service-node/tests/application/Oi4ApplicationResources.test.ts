import {OI4ApplicationResources} from '../../src';
import {MockedIApplicationResourceFactory} from '../Test-utils/Factories/MockedIApplicationResourceFactory';
import {IMasterAssetModel} from '@oi4/oi4-oec-service-opcua-model';
import fs = require('fs');

describe('Test Oi4ApplicationResources', () => {

    const mam: IMasterAssetModel = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance().mam;
    let resources: OI4ApplicationResources;

    beforeEach(() => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(JSON.stringify(mam)));
        resources = new OI4ApplicationResources();
    });

    it('If oi4Id not valid then error is thrown', () => {
        expect(() => resources.getLicense('123123123123')).toThrow('Sub resources not yet implemented');
    });

    it('If oi4Id undefined all licenses are returned', () => {
        console.log('Wait for it...');
        const license = resources.getLicense(undefined);
        expect(license).toBe(undefined);
    });

    it('If oi4Id has a value but licenseId is undefined all licenses are returned', () => {
        expect(resources.getLicense(resources.oi4Id)).toBe(undefined);
    });

});
