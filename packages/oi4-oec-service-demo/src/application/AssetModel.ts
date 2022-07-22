import {MasterAssetModel} from '@oi4/oi4-oec-service-model';

export class Asset extends MasterAssetModel {

    location: Location;

    static clone(source: Asset): Asset {
        const copy = new Asset();
        Object.assign(copy, source);
        return copy;
    }

    toMasterAssetModel(): MasterAssetModel {
        const copy = Asset.clone(this);
        delete copy.location;
        return copy;
    }
}

export interface Location {
    longitude: number;
    latitude: number;
}
