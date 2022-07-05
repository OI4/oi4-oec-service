import {IOPCUAMetaData, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {EDeviceHealth} from './EContainer';
import {
    IContainerConfig
} from './IContainer';
import {
    License,
    Health,
    RTLicense,
    Profile,
    MasterAssetModel, LicenseText, PublicationList, Resource, SubscriptionList
} from './Resource';

export interface IOI4ApplicationResources extends IOI4Resource {

    subResources: Map<string, IOI4ApplicationResources>;

    setHealthState(healthState: number): void;

    setHealth(health: EDeviceHealth): void;

    getLicense(oi4Id: string, licenseId?: string): License[];

    getPublicationList(oi4Id: string, resourceType?: Resource, tag?: string): PublicationList[];

    on(event: string, listener: Function): this;

    // Methods
    addDataSet(dataname: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}

export interface IOI4Resource {
    oi4Id: string;
    health: Health;
    profile: Profile;
    mam: MasterAssetModel;
    license: License[];
    licenseText: Map<string, LicenseText>;
    rtLicense: RTLicense;
    config: IContainerConfig;
    publicationList: PublicationList[];
    subscriptionList: SubscriptionList[];

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    setHealthState(healthState: number): void;
    setHealth(health: EDeviceHealth): void;

    getLicense(oi4Id: string, licenseId?: string): License[];

    getPublicationList(oi4Id?: string, resourceType?: Resource, tag?: string): PublicationList[];

    getSubscriptionList(oi4Id?: string, resourceType?: Resource, tag?: string): SubscriptionList[];

    on(event: string, listener: Function): this;

    // Methods
    addDataSet(dataSetName: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}
