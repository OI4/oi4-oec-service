import {OI4Payload} from '../Payload';
import {IMasterAssetModel, IOPCUALocalizedText} from '../../opcua/model/IOPCUA';
import {Oi4Identifier} from '../Oi4Identifier';
import {ServiceTypes, getServiceType} from '../ServiceTypes';
import {Resources} from '../Resources';

export class MasterAssetModel implements OI4Payload, IMasterAssetModel {
    Description: IOPCUALocalizedText;
    DeviceClass: string;
    DeviceManual: string;
    DeviceRevision: string;
    HardwareRevision: string;
    Manufacturer: IOPCUALocalizedText;
    ManufacturerUri: string;
    Model: IOPCUALocalizedText;
    ProductCode: string;
    ProductInstanceUri: string;
    RevisionCounter: number;
    SerialNumber: string;
    SoftwareRevision: string;

    resourceType(): Resources {
        return Resources.MAM;
    }

    getOI4Id(): Oi4Identifier {
        return new Oi4Identifier(this.ManufacturerUri, this.Model.Text, this.ProductCode, this.SerialNumber);
    }

    getServiceType(): ServiceTypes {
        const serviceType = this.DeviceClass.startsWith('Oi4.') ? this.DeviceClass.substring(4) : this.DeviceClass;
        return getServiceType(serviceType);
    }

    static clone(source: IMasterAssetModel): MasterAssetModel {
        const copy = new MasterAssetModel();
        Object.assign(copy, source);
        return copy;
    }
}
