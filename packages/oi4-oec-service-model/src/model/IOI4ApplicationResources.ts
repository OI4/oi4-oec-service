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

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    subResources: Map<string, IOI4Resource>;

    setHealthState(healthState: number): void;

    setHealth(health: EDeviceHealth): void;

    getLicense(oi4Id: string, licenseId?: string): License[];

    getSubscriptionList(oi4Id?: string, resourceType?: Resource, tag?: string): SubscriptionList[];

    getPublicationList(oi4Id: string, resourceType?: Resource, tag?: string): PublicationList[];

    on(event: string, listener: Function): this;

    // Methods
    addDataSet(dataname: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}

export interface IOI4Resource {
    readonly oi4Id: string;
    readonly profile: Profile;
    readonly mam: MasterAssetModel;
    health: Health;
    license: License[];
    licenseText: Map<string, LicenseText>;
    rtLicense: RTLicense;
    config: IContainerConfig;
    publicationList: PublicationList[];
    subscriptionList: SubscriptionList[];
}
