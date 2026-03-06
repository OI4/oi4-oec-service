import {IContainerConfig} from './IContainer';
import {
    Resources,
} from './Resources';
import {IOPCUAMetaData, IOPCUANetworkMessage} from '../opcua/model/IOPCUA';
import {Oi4Identifier} from './Oi4Identifier';
import {TypedEventEmitter} from './TypedEventEmitter';
import {MasterAssetModel} from './resources/MasterAssetModel';
import {Health} from './resources/Health';
import {SubscriptionList} from './resources/SubscriptionList';
import {PublicationList} from './resources/PublicationList';
import {Profile} from './resources/Profile';
import {ReferenceDesignation} from './resources/ReferenceDesignation';

export type OI4ResourceDefinition = {
    [key in OI4ResourceEvent]: [oi4Id: Oi4Identifier, resource: Resources];
};

export interface IOI4ApplicationResources extends IOI4Resource {

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    sources: Map<string, IOI4Resource>;

    getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel;

    getHealth(oi4Id: Oi4Identifier): Health;

    getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): SubscriptionList[];

    getPublicationList(oi4Id: Oi4Identifier, resourceType?: Resources, tag?: string): PublicationList[];

    setConfig(oi4Id: Oi4Identifier, filter: string, config: IContainerConfig): boolean;

    on(event: OI4ResourceEvent, listener: (oi4Id: Oi4Identifier, resource: Resources) => void): TypedEventEmitter<OI4ResourceDefinition>;

    addDataSet(dataSetName: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;

    hasSource(oi4Id: Oi4Identifier): boolean;

    getSource(oi4Id: Oi4Identifier): IOI4Resource;

    addSource(source: IOI4Resource | MasterAssetModel): IOI4Resource;

    removeSource(oi4Id: Oi4Identifier): boolean;

    getReferenceDesignation(oi4Id: Oi4Identifier): ReferenceDesignation;
}

export interface IOI4Resource {
    readonly oi4Id: Oi4Identifier;
    readonly profile: Profile;
    readonly mam: MasterAssetModel;
    health: Health;
    config: IContainerConfig;
    publicationList: PublicationList[];
    subscriptionList: SubscriptionList[];
    referenceDesignation: ReferenceDesignation;
}

export enum OI4ResourceEvent {
    RESOURCE_CHANGED = 'resourceChanged',
    RESOURCE_ADDED = 'resourceAdded',
    RESOURCE_REMOVED = 'resourceRemoved',
}
