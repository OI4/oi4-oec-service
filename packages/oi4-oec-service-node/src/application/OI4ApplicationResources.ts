import { ConfigParser } from '../Utilities/ConfigParser/ConfigParser';
import {
  IContainerConfig,
  IContainerHealth,
  IContainerRTLicense,
  ISubscriptionListObject,
  IPublicationListObject, Application, Resource, IOI4ApplicationResources, IContainerProfile, ILicenseObject,
} from '@oi4/oi4-oec-service-model';

import {
  IOPCUANetworkMessage,
  IOPCUAMetaData,
  IMasterAssetModel,
  IOPCUADataSetMetaData
} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';
import { EOPCUALocale } from '@oi4/oi4-oec-service-opcua-model';
import { EDeviceHealth, EPublicationListConfig, ESubscriptionListConfig } from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {ConfigFiles, MAMPathSettings} from '../Config/MAMPathSettings';
/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends ConfigParser implements IOI4ApplicationResources {
  public oi4Id: string; // TODO: doubling? Not needed here
  private readonly _profile: IContainerProfile;
  private readonly _mam: IMasterAssetModel;
  private _health: IContainerHealth;
  private _brokerState: boolean;
  private _license: ILicenseObject[];
  private _licenseText: Record<string, string>;
  private _rtLicense: IContainerRTLicense;
  private _publicationList: IPublicationListObject[];
  private _subscriptionList: ISubscriptionListObject[];
/**
 * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
 * */
  constructor(mamFile: string = `${MAMPathSettings.CONFIG_DIRECTORY}${ConfigFiles.mam}`) {
    super();

    this._mam = OI4ApplicationResources.extractMamFile(mamFile); // Import MAM from JSON

    if(this.mam === undefined) {
      throw Error('MAM File not found');
    }

    this.mam.Description.locale = EOPCUALocale.enUS; // Fill in container-specific values
    this.mam.SerialNumber = os.hostname();
    this.mam.ProductInstanceUri = `${this.mam.ManufacturerUri}/${encodeURIComponent(this.mam.Model.text)}/${encodeURIComponent(this.mam.ProductCode)}/${encodeURIComponent(this.mam.SerialNumber)}`;

    this.oi4Id = this.mam.ProductInstanceUri;

    this.brokerState = false;

    this._profile = {
      resource: [
        'health',
        'license',
        'rtLicense',
        'config',
        'mam',
        'profile',
        'licenseText',
        'publicationList',
        'subscriptionList',
        'event',
      ],
    };

    this._health = {
      health: EDeviceHealth.NORMAL_0,
      healthScore: 100,
    };

    this.rtLicense = {};

    this.dataLookup = {};
    this.metaDataLookup = {};

    this.publicationList = []

    this.subscriptionList = []

    // Fill both pubList and subList
    for (const resources of this.profile.resource) {
      let resInterval = 0;
      if (resources === 'health') {
        resInterval = 60000;
      } else {
        resInterval = 0;
      }
      this.addPublication({
        resource: resources,
        tag: this.oi4Id,
        DataSetWriterId: 0,
        oi4Identifier: this.oi4Id,
        interval: resInterval,
        config: EPublicationListConfig.NONE_0,
      });

      this.addSubscription({
        topicPath: `oi4/${this.mam.DeviceClass}/${this.oi4Id}/get/${resources}/${this.oi4Id}`,
        interval: 0,
        config: ESubscriptionListConfig.NONE_0,
      });
    }

  }

  dataLookup: Record<string, IOPCUANetworkMessage>;
  metaDataLookup: Record<string, IOPCUADataSetMetaData>;

  private static extractMamFile(path: string): IMasterAssetModel  {
    if(existsSync(path)){
        return JSON.parse(readFileSync(path).toString());
    }
    return undefined;
  }

  // Property accessor section
  get brokerState() {
    return this._brokerState;
  }

  set brokerState(brokerState: boolean) {
    this._brokerState = brokerState;
  }
  // Resource accesor section
  // --- HEALTH ---

  get health() {
    return this._health;
  }

  set health(health: IContainerHealth) {
    if (health.healthScore >= 100 && health.healthScore <= 0) throw new RangeError('healthState out of range');
    this._health = health;
    this.emit('resourceChanged', 'health');
  }

  setHealthState(healthState: number) {
    if (healthState >= 100 && healthState <= 0) throw new RangeError('healthState out of range');
    this._health.healthScore = healthState;
    this.emit('resourceChanged', 'health');
  }

  setHealth(health: EDeviceHealth) {
    this._health.health = health;
    this.emit('resourceChanged', 'health');
  }

  // --- MAM ---

  get mam(): IMasterAssetModel {
    return this._mam;
  }

  // --- Profile ---
  get profile(): IContainerProfile {
    return this._profile;
  }

  addProfile(entry: string): void {
    if (!(Application.full.includes(Resource[entry]))) console.log('Attention! Adding non-conform profile entry, proceed at own risk');
    this.profile.resource.push(entry);
    this.emit('resourceChanged', 'profile');
  }

  // --- License ---

  get license(): ILicenseObject[] {
    return this._license;
  }

  private set license(license) {
    this._license = license
  }

  // --- LicenseText ---
  get licenseText(): Record<string, string> {
    return this._licenseText;
  }

  private set licenseText(licenseText) {
    this._licenseText = licenseText;
  }

  // TODO: Add dynamic ENUM containing all spdx licenseIds
  addLicenseText(licenseName: string, licenseText: string) {
    this.licenseText[licenseName] = licenseText;
    this.emit('resourceChanged', 'licenseText');
  }

  // --- rtLicense ---
  get rtLicense(): IContainerRTLicense {
    return this._rtLicense;
  }

  private set rtLicense(rtLicense) {
    this._rtLicense = rtLicense;
  }

  // --- publicationList ---
  get publicationList(): IPublicationListObject[] {
    return this._publicationList;
  }

  private set publicationList(publicationList) {
    this._publicationList = publicationList;
  }

  addPublication(publicationObj: IPublicationListObject): void {
    this.publicationList.push(publicationObj);
    this.emit('resourceChanged', 'publicationList');
  }

  removePublicationByTag(tag: string): void {
    this.publicationList = this.publicationList.filter(value => value.tag !== tag);
    this.emit('resourceChanged', 'publicationList');
  }

  // --- subscriptionList ---
  get subscriptionList(): ISubscriptionListObject[] {
    return this._subscriptionList;
  }

  private set subscriptionList(subscriptionList) {
    this._subscriptionList = subscriptionList;
  }

  addSubscription(subscriptionObj: ISubscriptionListObject): void {
    this.subscriptionList.push(subscriptionObj);
    this.emit('resourceChanged', 'subscriptionList');
  }

  removeSubscriptionByTopic(topic: string): void {
    this.subscriptionList = this.subscriptionList.filter(value => value.topicPath !== topic);
    this.emit('resourceChanged', 'subscriptionList');
  }

  /**
   * Add a DataSet to the container, so that it can be sent externally via an application
   * @param key - the key under which the dataset will be saved as (data / metadata)
   * @param data - the completely built OPCUA Data message
   * @param metadata - the completely build OPCUA Metadata message (optional)
   */
  public addDataSet(key: string, data: IOPCUANetworkMessage, metadata?: IOPCUAMetaData) {
    this.dataLookup[key] = data;
    if (metadata) {
      this.metaDataLookup[key] = metadata;
    }
  }
}

export { OI4ApplicationResources, IContainerConfig, IContainerRTLicense };
