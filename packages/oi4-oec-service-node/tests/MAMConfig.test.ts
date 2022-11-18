import {OI4ApplicationResources} from '../src';
import fs from 'fs';
import {IMasterAssetModel} from '@oi4/oi4-oec-service-model';
import os from 'os';

describe('Unit test for MAMStorage reading', () => {

    beforeEach(()=>{
        jest.resetAllMocks();
    })
    afterAll(()=>{
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    })
    it('Should read mam correctly from file', async () => {
        const mam = fs.readFileSync(`${__dirname}/__fixtures__/mam.json`);
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce(mam)
            .mockReturnValueOnce(mam);
        const expectedMAM = JSON.parse(mam.toString()) as IMasterAssetModel;
        const resources = new OI4ApplicationResources(`${__dirname}/__fixtures__/mam.json`);

        expect(resources.mam.DeviceClass).toEqual(expectedMAM.DeviceClass);
        expect(resources.mam.ProductInstanceUri).toEqual(`${expectedMAM.ManufacturerUri}/${encodeURIComponent(expectedMAM.Model.Text)}/${encodeURIComponent(expectedMAM.ProductCode)}/${encodeURIComponent(os.hostname())}`);
        expect(resources.mam.Model).toEqual(expectedMAM.Model);
        expect(resources.mam.HardwareRevision).toEqual(expectedMAM.HardwareRevision);
        expect(resources.mam.SerialNumber).toEqual(os.hostname());

    });

    it('Should throw error if file not found', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        expect(()=>new OI4ApplicationResources()).toThrowError();

    });
});
