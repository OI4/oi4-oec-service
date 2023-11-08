import {OI4Payload} from './Payload';
import {EDeviceHealth} from './EContainer';
import {IMasterAssetModel, IOPCUALocalizedText} from '../opcua/model/IOPCUA';
import {Oi4Identifier} from './Oi4Identifier';
import {ServiceTypes, getServiceType} from './ServiceTypes';

export enum Resources {
    MAM = 'MAM',
    HEALTH = 'Health',
    LICENSE = 'License',
    LICENSE_TEXT = 'LicenseText',
    PROFILE = 'Profile',
    DATA = 'Data',
    RT_LICENSE = 'RtLicense',
    CONFIG = 'Config',
    EVENT = 'Event',
    METADATA = 'Metadata',
    PUBLICATION_LIST = 'PublicationList',
    SUBSCRIPTION_LIST = 'SubscriptionList',
    REFERENCE_DESIGNATION = 'ReferenceDesignation',
    INTERFACES = 'Interfaces',
    AAS = 'AAS'
}

export function getResource(resource: string): Resources {
    switch (resource) {
        case Resources.MAM:
            return Resources.MAM;
        case Resources.HEALTH:
            return Resources.HEALTH;
        case Resources.LICENSE:
            return Resources.LICENSE;
        case Resources.LICENSE_TEXT:
            return Resources.LICENSE_TEXT;
        case Resources.PROFILE:
            return Resources.PROFILE;
        case Resources.DATA:
            return Resources.DATA;
        case Resources.RT_LICENSE:
            return Resources.RT_LICENSE;
        case Resources.CONFIG:
            return Resources.CONFIG;
        case Resources.EVENT:
            return Resources.EVENT;
        case Resources.METADATA:
            return Resources.METADATA;
        case Resources.PUBLICATION_LIST:
            return Resources.PUBLICATION_LIST;
        case Resources.SUBSCRIPTION_LIST:
            return Resources.SUBSCRIPTION_LIST;
        case Resources.REFERENCE_DESIGNATION:
            return Resources.REFERENCE_DESIGNATION;
        case Resources.INTERFACES:
            return Resources.INTERFACES;
        case Resources.AAS:
            return Resources.AAS;
        default:
            throw new Error(`Unknown resource: ${resource}`);
    }
}

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

export class Health implements OI4Payload {
    readonly Health: EDeviceHealth;
    readonly HealthScore: number; // UInt16 (from 0 to 100%)

    constructor(health: EDeviceHealth, healthScore: number) {
        this.Health = health;
        this.HealthScore = healthScore;
    }

    resourceType(): Resources {
        return Resources.HEALTH;
    }

    static clone(source: Health): Health {
        return new Health(source.Health, source.HealthScore);
    }
}

export class RTLicense implements OI4Payload {
    resourceType(): Resources {
        return Resources.RT_LICENSE;
    }
}

export class License implements OI4Payload {
    readonly LicenseId: string;
    readonly Components: IComponentObject[];

    constructor(licenseId: string, components: IComponentObject[]) {
        this.LicenseId = licenseId;
        this.Components = components;
    }

    resourceType(): Resources {
        return Resources.LICENSE;
    }

    static clone(source: License): License {
        return new License(source.LicenseId, source.Components);
    }

}

export class LicenseText implements OI4Payload {
    readonly LicenseText: string;

    constructor(licenseText: string) {
        this.LicenseText = licenseText;
    }

    resourceType(): Resources {
        return Resources.LICENSE_TEXT;
    }

    static clone(source: LicenseText): LicenseText {
        return new LicenseText(source.LicenseText);
    }
}

export class Profile implements OI4Payload {
    readonly Resources: Resources[];

    constructor(resources: Resources[]) {
        this.Resources = Object.assign([], resources);
    }

    resourceType(): Resources {
        return Resources.PROFILE;
    }

    static clone(source: Profile): Profile {
        return new Profile(source.Resources);
    }
}

export class PublicationList implements OI4Payload {
    Resource: Resources;
    Source: Oi4Identifier;
    Filter?: string;
    DataSetWriterId: number; // Actually OI4-Identifier: TODO: Validator
    Mode: PublicationListMode;
    Interval?: number; // UINT32
    Precisions?: number; // REAL
    Config?: PublicationListConfig;

    resourceType(): Resources {
        return Resources.PUBLICATION_LIST;
    }

    static clone(source: PublicationList): PublicationList {
        const copy = new PublicationList();
        Object.assign(copy, source);
        return copy;
    }
}

export class SubscriptionList implements OI4Payload {
    TopicPath: string;
    Interval: number;
    Config?: SubscriptionListConfig;

    resourceType(): Resources {
        return Resources.SUBSCRIPTION_LIST;
    }

    static clone(source: SubscriptionList): SubscriptionList {
        const copy = new SubscriptionList();
        Object.assign(copy, source);
        return copy;
    }
}

export enum PublicationListMode {
    OFF_0 = 'OFF_0',
    ON_REQUEST_1 = 'ON_REQUEST_1',
    APPLICATION_2 = 'APPLICATION_2',
    SOURCE_3 = 'SOURCE_3',
    FILTER_4 = 'FILTER_4',
    APPLICATION_SOURCE_5 = 'APPLICATION_SOURCE_5',
    APPLICATION_FILTER_6 = 'APPLICATION_FILTER_6',
    SOURCE_FILTER_7 = 'SOURCE_FILTER_7',
    APPLICATION_SOURCE_FILTER_8 = 'APPLICATION_SOURCE_FILTER_8',
}

export enum PublicationListConfig {
    NONE_0 = 'NONE_0',
    MODE_1 = 'MODE_1',
    INTERVAL_2 = 'INTERVAL_2',
    MODE_AND_INTERVAL_3 = 'MODE_AND_INTERVAL_3',
}

export enum SubscriptionListConfig {
    NONE_0 = 'NONE_0',
    CONF_1 = 'CONF_1',
}

export interface IComponentObject {
    Component: string;
    LicAuthors: string[];
    LicAddText: string;
}

export class AAS implements OI4Payload {
    readonly AASId: string;
    readonly GlobalAssetId: string;

    constructor(id: string, gId: string) {
        this.AASId = id;
        this.GlobalAssetId = gId;
    }

    resourceType(): Resources {
        return Resources.AAS;
    }

    static clone(source: AAS): AAS {
        return new AAS(source.AASId, source.GlobalAssetId);
    }


}

