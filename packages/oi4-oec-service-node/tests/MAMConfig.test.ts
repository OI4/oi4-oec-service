import {ApplicationResources} from '../src/Container/ApplicationResources';
import fs from 'fs';
import {IMasterAssetModel} from '@oi4/oi4-oec-service-opcua-model';
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
        const containerState = new ApplicationResources();
        expect(containerState.mam.DeviceClass).toEqual(expectedMAM.DeviceClass);
        expect(containerState.mam.ProductInstanceUri).toEqual(`${expectedMAM.ManufacturerUri}/${encodeURIComponent(expectedMAM.Model.text)}/${encodeURIComponent(expectedMAM.ProductCode)}/${encodeURIComponent(os.hostname())}`);
        expect(containerState.mam.Model).toEqual(expectedMAM.Model);
        expect(containerState.mam.HardwareRevision).toEqual(expectedMAM.HardwareRevision);
        expect(containerState.mam.SerialNumber).toEqual(os.hostname());

    });

    it('Should throw error if file not found', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        expect(()=>new ApplicationResources()).toThrowError();

    });
});
