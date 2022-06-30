import {OI4Payload} from "./Payload";
import {EDeviceHealth} from "./EContainer";

export enum Resource {
    MAM = 'mam',
    HEALTH = 'health',
    LICENSE = 'license',
    LICENSE_TEXT = 'licenseText',
    PROFILE = 'profile',
    DATA = 'data',
    RT_LICENSE = 'rtLicense',
    CONFIG = 'config',
    EVENT = 'event',
    METADATA = 'metadata',
    PUBLICATION_LIST = 'publicationList',
    SUBSCRIPTION_LIST = 'subscriptionList',
    REFERENCE_DESIGNATION = 'referenceDesignation'
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
}

export class RTLicense implements OI4Payload {
    resourceType(): Resource {
        return Resource.RT_LICENSE;
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

}

export class Profile implements OI4Payload {
    readonly resource: Resource[];

    constructor(resource: Resource[]) {
        this.resource = resource;
    }

    resourceType(): Resource {
        return Resource.PROFILE;
    }
}

export interface IComponentObject {
    component: string;
    licAuthors: string[];
    licAddText: string;
}

