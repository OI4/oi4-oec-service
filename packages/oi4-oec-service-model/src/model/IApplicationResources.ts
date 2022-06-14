import {IMasterAssetModel, IOPCUAMetaData, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {ISpecificContainerConfig} from './IContainerConfig';
import {EDeviceHealth} from './EContainer';
import {
    IContainerData,
    IContainerHealth,
    IContainerLicense,
    IContainerLicenseText, IContainerMetaData,
    IContainerProfile, IContainerPublicationList,
    IContainerRTLicense, IContainerSubscriptionList, IPublicationListObject, ISubscriptionListObject
} from './IContainer';

export interface IApplicationResources {
    oi4Id: string;
    health: IContainerHealth;
    profile: IContainerProfile;
    mam: IMasterAssetModel;
    license: IContainerLicense;
    licenseText: IContainerLicenseText;
    rtLicense: IContainerRTLicense;
    config: ISpecificContainerConfig;
    publicationList: IContainerPublicationList;
    subscriptionList: IContainerSubscriptionList;
    brokerState: boolean;

    dataLookup: IContainerData;
    metaDataLookup: IContainerMetaData;

    setHealthState(healthState: number): void;
    setHealth(health: EDeviceHealth): void;

    addProfile(entry: string): void;
    addLicenseText(licenseName: string, licenseText: string): void;
    addPublication(publicationObj: IPublicationListObject): void;
    addSubscription(subbscriptionObj: ISubscriptionListObject): void;

    removePublicationByTag(tag: string): void;
    removeSubscriptionByTopic(topic: string): void;

    on(event: string, listener: Function): this;

    // Methods
    addDataSet(dataname: string, data: IOPCUANetworkMessage, metadata: IOPCUAMetaData): void;
}
