import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {Asset} from '../../src/application/AssetModel';
import {Resource} from '@oi4/oi4-oec-service-model';

describe('AssetModel.ts test', () => {
    it('should return MasterAssetModel', async () => {
        const file = JSON.parse(fs.readFileSync(`${__dirname}/../__fixtures__/asset.json`, 'utf-8'));
        const asset = Asset.clone(file as Asset);

        const mam = Object.keys(file).reduce((object, key) => {
            if (key !== 'location') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                object[key]= file[key]
            }
            return object
        }, {})

        expect(asset.toMasterAssetModel()).toEqual(mam);
        expect(asset.resourceType()).toEqual(Resource.MAM);
    });
});
