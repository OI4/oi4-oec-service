import {IContainerConfig} from './IContainer';
import {
    AAS,
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
import {EventEmitter} from 'events';

export interface IOI4ApplicationResources extends IOI4Resource {

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    sources: Map<string, IOI4Resource>;

    getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel;

    getHealth(oi4Id: Oi4Identifier): Health;

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[];

    getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): SubscriptionList[];

    getPublicationList(oi4Id: Oi4Identifier, resourceType?: Resources, tag?: string): PublicationList[];

    setConfig(oi4Id: Oi4Identifier, filter: string, config: IContainerConfig): boolean;

    on(event: OI4ResourceEvent, listener: (oi4Id: Oi4Identifier, resource: Resources) => void): EventEmitter;

    addDataSet(dataSetName: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;

    hasSource(oi4Id: Oi4Identifier): boolean;

    getSource(oi4Id: Oi4Identifier): IOI4Resource;

    addSource(source: IOI4Resource | MasterAssetModel): IOI4Resource;

    removeSource(oi4Id: Oi4Identifier): boolean;

    getAAS(oi4Id: Oi4Identifier): AAS;
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
    aas: AAS;
}

export enum OI4ResourceEvent {
    RESOURCE_CHANGED = 'resourceChanged',
    RESOURCE_ADDED = 'resourceAdded',
    RESOURCE_REMOVED = 'resourceRemoved',
}
