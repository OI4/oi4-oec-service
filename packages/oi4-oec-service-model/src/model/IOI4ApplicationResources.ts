import {IContainerConfig} from './IContainer';
import {
    Resources,
} from './Resources';
import {IOPCUAMetaData, IOPCUANetworkMessage} from '../opcua/model/IOPCUA';
import {Oi4Identifier} from './Oi4Identifier';
import {EventEmitter} from 'events';
import {MasterAssetModel} from './resources/MasterAssetModel';
import {Health} from './resources/Health';
import {License} from './resources/License';
import {SubscriptionList} from './resources/SubscriptionList';
import {PublicationList} from './resources/PublicationList';
import {AAS} from './resources/AAS';
import {Profile} from './resources/Profile';
import {LicenseText} from './resources/LicenseText';
import {RTLicense} from './resources/RTLicense';
import {ReferenceDesignation} from './resources/ReferenceDesignation';

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

    getReferenceDesignation(oi4Id: Oi4Identifier): ReferenceDesignation;
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
    referenceDesignation: ReferenceDesignation;
    aas: AAS;
}

export enum OI4ResourceEvent {
    RESOURCE_CHANGED = 'resourceChanged',
    RESOURCE_ADDED = 'resourceAdded',
    RESOURCE_REMOVED = 'resourceRemoved',
}
