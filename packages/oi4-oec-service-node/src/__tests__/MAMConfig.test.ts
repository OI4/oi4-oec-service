import {ContainerState} from '../Container';
import fs from 'fs';
import {IMasterAssetModel} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';

describe('Unit test for MAMStorage reading', () => {

    it('Should read mam correctly from file', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync('./src/__fixtures__/mam.json'));

        const expectedMAM = JSON.parse(fs.readFileSync('./src/__fixtures__/mam.json').toString()) as IMasterAssetModel;
        const containerState = new ContainerState();
        expect(containerState.mam.DeviceClass).toEqual(expectedMAM.DeviceClass);
        expect(containerState.mam.ProductInstanceUri).toEqual(`${expectedMAM.ManufacturerUri}/${encodeURIComponent(expectedMAM.Model.text)}/${encodeURIComponent(expectedMAM.ProductCode)}/${encodeURIComponent(os.hostname())}`);
        expect(containerState.mam.Model).toEqual(expectedMAM.Model);
        expect(containerState.mam.HardwareRevision).toEqual(expectedMAM.HardwareRevision);
        expect(containerState.mam.SerialNumber).toEqual(os.hostname());

    });

    it('Should throw error if file not found', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        expect(()=>new ContainerState()).toThrowError();

    });
});
