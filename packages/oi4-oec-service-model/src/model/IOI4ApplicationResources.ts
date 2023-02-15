import {IContainerConfig} from './IContainer';
import {
    Health,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resources,
    RTLicense,
    SubscriptionList
} from './Resources';
import {IOPCUAMetaData, IOPCUANetworkMessage} from '../opcua/model/IOPCUA';
import {Oi4Identifier} from './Oi4Identifier';

export interface IOI4ApplicationResources extends IOI4Resource {

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    sources: Map<Oi4Identifier, IOI4Resource>;

    getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel;

    getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource>;

    getHealth(oi4Id: Oi4Identifier): Health;

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[];

    getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): SubscriptionList[];

    getPublicationList(oi4Id: Oi4Identifier, resourceType?: Resources, tag?: string): PublicationList[];

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
