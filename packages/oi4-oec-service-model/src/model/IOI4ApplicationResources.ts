import {IOPCUAMetaData, IOPCUANetworkMessage, Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';
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

    getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel;

    getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource>;

    getHealth(oi4Id: Oi4Identifier): Health;

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[];

    getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resource, tag?: string): SubscriptionList[];

    getPublicationList(oi4Id: Oi4Identifier, resourceType?: Resource, tag?: string): PublicationList[];

    setConfig(oi4Id: Oi4Identifier, filter: string, config: IContainerConfig): boolean;

    on(event: string, listener: Function): this;

    addDataSet(dataSetName: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}

export interface IOI4Resource {
    readonly oi4Id: Oi4Identifier;
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
