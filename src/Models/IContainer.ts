import { IOPCUAData, IOPCUAMetaData, IMasterAssetModel } from './IOPCUAPayload';

export interface IEventObject {
  originId?: string;
  logLevel: string;
  logText: string;
}

export interface IContainerData {
  [key: string]: IOPCUAData; // TODO: should this really be an object? Maybe an array is better suited here.
}

export interface IContainerMetaData {
  [key: string]: IOPCUAMetaData;
}

export interface IContainerConfig {

}

export interface IContainerHealth {
  health: EDeviceHealth;
  healthScore: number; // UInt16 (from 0 to 100%)
}

export interface IContainerEvent {
  number: number;
  description: string;
  payload: object;
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
  config: IContainerConfig;
  publicationList: IContainerPublicationList;
  subscriptionList: IContainerSubscriptionList;

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
  addDataSet(dataname: string, data: IOPCUAData, metadata: IOPCUAMetaData): void;
}

export enum ESubResource {
  trace = 'trace',
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
  fatal = 'fatal',
}

export enum EDeviceHealth {
  NORMAL_0 = 'NORMAL_0',
  FAILURE_1 = 'FAILURE_1',
  CHECK_FUNCTION_2 = 'CHECK_FUNCTION_2',
  OFF_SPEC_3 = 'OFF_SPEC_3',
  MAINTENANCE_REQUIRED_4 = 'MAINTENANCE_REQUIRED_4',
}

export enum EPublicationListExplicit {
  EXPL_OFF_0 = 'EXPL_OFF_0',
  EXPL_TAG_1 = 'EXPL_TAG_1',
  EXPL_DSWID_2 = 'EXPL_DSWID_2',
  EXPL_TAG_AND_DSWID_3 = 'EXPL_TAG_AND_DSWID_3'
}

export enum EPublicationListConfig {
  NONE_0 = 'NONE_0',
  STATUS_1 = 'STATUS_1',
  INTERVAL_2 = 'INTERVAL_2',
  STATUS_AND_INTERVAL_3 = 'STATUS_AND_INTERVAL_3',
}

export enum ESubscriptionListConfig {
  NONE_0 = 'NONE_0',
  CONF_1 = 'CONF_1',
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
