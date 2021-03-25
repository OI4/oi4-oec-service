import { ISpecificContainerConfig } from '../Config/IContainerConfig';
import { EDeviceHealth, EPublicationListConfig, EPublicationListExplicit, ESubscriptionListConfig } from '../Enums/EContainer';
import { EOPCUABaseDataType } from '../Enums/EOPCUA';
import { IOPCUANetworkMessage, IOPCUAMetaData, IMasterAssetModel, IOPCUALocalizedText } from './IOPCUA';

export interface IEventObject {
  number: number;
  description?: string;
  category: string;
  details: any;
  level?: string; // NOT OI4 Conform and just for us
  timestamp: string; // NOT OI4 Conform and just for us
  tag: string; // Oi4Id of log originator
}

export interface IContainerData {
  [key: string]: IOPCUANetworkMessage; // TODO: should this really be an object? Maybe an array is better suited here.
}

export interface IContainerMetaData {
  [key: string]: IOPCUAMetaData;
}

// Common Container config interfaces
export interface IContainerConfig {
  [key:string]: IContainerConfigGroupName | IContainerConfigContext;
  context: IContainerConfigContext;
}

export interface IContainerConfigContext {
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
}

export interface IContainerConfigGroupName {
  [key: string]: IContainerConfigConfigName | IOPCUALocalizedText | undefined; // TODO: Better to use intersected types here, this solution is a hotfix.
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
}

export interface IContainerConfigConfigName {
  type: EOPCUABaseDataType;
  value: string; // This depends on the specified type
  unit?: string;
  defaultValue?: string;
  mandatory?: boolean;
  sensitive? : boolean;
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
  validation?: IContainerConfigValidation; 
}

export interface IContainerConfigValidation {
  length?: number;
  min?: number;
  max?: number;
  pattern?: string;
  values?: string[]; 
}

export interface IContainerHealth {
  health: EDeviceHealth;
  healthScore: number; // UInt16 (from 0 to 100%)
}

export interface IContainerEvent {
  number: number;
  description?: string;
  category: EContainerEventCategory;
  details?: object;
}

export enum EContainerEventCategory {
  CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
  CAT_OPCSC_1 = 'CAT_OPCSC_1',
  CAT_NE107_2 = 'CAT_NE107_2',
  CAT_GENERIC_99 = 'CAT_GENERIC_99',
}

export interface IContainerRTLicense {

}

export interface IContainerProfile {
  resource: string[];
}

export interface IComponentObject {
  component: string;
  licAuthors: string[];
  licAddText: string;
}

export interface ILicenseObject {
  licenseId: string;
  components: IComponentObject[];
}

export interface IContainerLicense {
  licenses: ILicenseObject[];
}

export interface IContainerLicenseText {
  [key: string]: string;
}

export interface IContainerPublicationList {
  publicationList: IPublicationListObject[];
}

export interface IContainerSubscriptionList {
  subscriptionList: ISubscriptionListObject[];
}

export interface ISubscriptionListObject {
  topicPath: string;
  interval?: number;
  config?: ESubscriptionListConfig;
}

export interface IPublicationListObject {
  resource: string;
  tag?: string;
  DataSetWriterId: number; // Actually OI4-Identifier: TODO: Validator
  oi4Identifier: string;
  active?: boolean;
  explicit?: EPublicationListExplicit;
  interval?: number; // UINT32
  precisions?: number; // REAL
  config?: EPublicationListConfig;
}

export interface IContainerState {
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

export interface IDataSetClassIds {
  [key: string]: string;
  mam: string;
  health: string;
  license: string;
  licenseText: string;
  rtLicense: string;
  event: string;
  profile: string;
  config: string;
  publicationList: string;
  subscriptionList: string;
}

interface IDataSetWriterIdLookup { // TODO: need better types here, EResources or so
  [key: string]: number;
}

export const CDataSetWriterIdLookup: IDataSetWriterIdLookup = {
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
