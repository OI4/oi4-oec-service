import {IMasterAssetModel, IOPCUAMetaData, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {EDeviceHealth} from './EContainer';
import {
    IContainerConfig,
    IContainerHealth,
    IContainerProfile,
    IContainerRTLicense,
    ILicenseObject,
    IPublicationListObject,
    ISubscriptionListObject
} from './IContainer';

export interface IOI4ApplicationResources {
    oi4Id: string;
    health: IContainerHealth;
    profile: IContainerProfile;
    mam: IMasterAssetModel;
    license: ILicenseObject[];
    licenseText: Record<string, string>;
    rtLicense: IContainerRTLicense;
    config: IContainerConfig;
    publicationList: IPublicationListObject[];
    subscriptionList: ISubscriptionListObject[];
    brokerState: boolean;

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUAMetaData>;

    setHealthState(healthState: number): void;
    setHealth(health: EDeviceHealth): void;

    addProfile(entry: string): void;
    addLicenseText(licenseName: string, licenseText: string): void;
    addPublication(publicationObj: IPublicationListObject): void;
    addSubscription(subscriptionObj: ISubscriptionListObject): void;

    removePublicationByTag(tag: string): void;
    removeSubscriptionByTopic(topic: string): void;

    on(event: string, listener: Function): this;

    // Methods
    addDataSet(dataname: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}
