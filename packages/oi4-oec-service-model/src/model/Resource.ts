import {OI4Payload} from './Payload';
import {EDeviceHealth} from './EContainer';
import {
    IMasterAssetModel,
    IOPCUALocalizedText,
    Oi4Identifier,
    ServiceTypes,
    getServiceType
} from '@oi4/oi4-oec-service-opcua-model';

export enum Resource {
    MAM = 'mam',
    HEALTH = 'health',
    LICENSE = 'license',
    LICENSE_TEXT = 'licenseText',
    PROFILE = 'profile',
    DATA = 'data',
    RT_LICENSE = 'rtLicense',
    CONFIG = 'config',
    INTERFACE = 'interface',
    EVENT = 'event',
    METADATA = 'metadata',
    PUBLICATION_LIST = 'publicationList',
    SUBSCRIPTION_LIST = 'subscriptionList',
    REFERENCE_DESIGNATION = 'referenceDesignation',
    INTERFACES = 'interfaces'
}

export function getResource(resource: string): Resource {
    switch (resource) {
        case Resource.MAM:
            return Resource.MAM;
        case Resource.HEALTH:
            return Resource.HEALTH;
        case Resource.LICENSE:
            return Resource.LICENSE;
        case Resource.LICENSE_TEXT:
            return Resource.LICENSE_TEXT;
        case Resource.PROFILE:
            return Resource.PROFILE;
        case Resource.DATA:
            return Resource.DATA;
        case Resource.RT_LICENSE:
            return Resource.RT_LICENSE;
        case Resource.CONFIG:
            return Resource.CONFIG;
        case Resource.EVENT:
            return Resource.EVENT;
        case Resource.METADATA:
            return Resource.METADATA;
        case Resource.PUBLICATION_LIST:
            return Resource.PUBLICATION_LIST;
        case Resource.SUBSCRIPTION_LIST:
            return Resource.SUBSCRIPTION_LIST;
        case Resource.REFERENCE_DESIGNATION:
            return Resource.REFERENCE_DESIGNATION;
        case Resource.INTERFACES:
            return Resource.INTERFACES;
        default:
            throw new Error(`Unknown resource: ${resource}`);
    }
}

// TODO I am totally wrong remove me for ever...
export const CDataSetWriterIdLookup: Record<string, number> = {
    mam: 1,
    health: 2,
    license: 3,
    licenseText: 4,
    rtLicense: 5,
    event: 6,
    profile: 7,
    config: 8,
    publicationList: 9,
    subscriptionList: 10,
    interfaces: 11
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

    resourceType(): Resource {
        return Resource.MAM;
    }

    getOI4Id(): Oi4Identifier {
        return new Oi4Identifier(this.ManufacturerUri, this.Model.text, this.ProductCode, this.SerialNumber);
    }

    getServiceType(): ServiceTypes {
        const serviceType = this.DeviceClass.startsWith('OI4.') ? this.DeviceClass.substring(4) : this.DeviceClass;
        return getServiceType(serviceType);
    }

    static clone(source: MasterAssetModel): MasterAssetModel {
        const copy = new MasterAssetModel();
        Object.assign(copy, source);
        return copy;
    }
}

export class Health implements OI4Payload {
    readonly health: EDeviceHealth;
    readonly healthScore: number; // UInt16 (from 0 to 100%)

    constructor(health: EDeviceHealth, healthScore: number) {
        this.health = health;
        this.healthScore = healthScore;
    }

    resourceType(): Resource {
        return Resource.HEALTH;
    }

    static clone(source: Health): Health {
        return new Health(source.health, source.healthScore);
    }
}

export class RTLicense implements OI4Payload {
    resourceType(): Resource {
        return Resource.RT_LICENSE;
    }
}

export class License implements OI4Payload {
    readonly licenseId: string;
    readonly components: IComponentObject[];

    constructor(licenseId: string, components: IComponentObject[]) {
        this.licenseId = licenseId;
        this.components = components;
    }

    resourceType(): Resource {
        return Resource.LICENSE;
    }

    static clone(source: License): License {
        return new License(source.licenseId, source.components);
    }

}

export class LicenseText implements OI4Payload {
    readonly licenseText: string;

    constructor(licenseText: string) {
        this.licenseText = licenseText;
    }

    resourceType(): Resource {
        return Resource.LICENSE_TEXT;
    }

    static clone(source: LicenseText): LicenseText {
        return new LicenseText(source.licenseText);
    }
}

export class Profile implements OI4Payload {
    readonly resource: Resource[];

    constructor(resource: Resource[]) {
        this.resource = resource;
    }

    resourceType(): Resource {
        return Resource.PROFILE;
    }

    static clone(source: Profile): Profile {
        return new Profile(source.resource);
    }
}

export class PublicationList implements OI4Payload {
    resource: Resource;
    subResource?: string;
    filter?: string;
    DataSetWriterId: number; // Actually OI4-Identifier: TODO: Validator
    oi4Identifier: Oi4Identifier;
    mode: PublicationListMode;
    interval?: number; // UINT32
    precisions?: number; // REAL
    config?: PublicationListConfig;

    resourceType(): Resource {
        return Resource.PUBLICATION_LIST;
    }

    static clone(source: PublicationList): PublicationList {
        const copy = new PublicationList();
        Object.assign(copy, source);
        return copy;
    }
}

export class SubscriptionList implements OI4Payload {
    topicPath: string;
    interval: number;
    config?: SubscriptionListConfig;

    resourceType(): Resource {
        return Resource.SUBSCRIPTION_LIST;
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
    SUBRESOURCE_3 = 'SUBRESOURCE_3',
    FILTER_4 = 'FILTER_4',
    APPLICATION_SUBRESOURCE_5 = 'APPLICATION_SUBRESOURCE_5',
    APPLICATION_FILTER_6 = 'APPLICATION_FILTER_6',
    SUBRESOURCE_FILTER_7 = 'SUBRESOURCE_FILTER_7',
    APPLICATION_SUBRESOURCE_FILTER_8 = 'APPLICATION_SUBRESOURCE_FILTER_8',
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
    component: string;
    licAuthors: string[];
    licAddText: string;
}

