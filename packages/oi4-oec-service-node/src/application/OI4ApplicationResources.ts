import {ConfigParser} from '../Utilities/ConfigParser/ConfigParser';
import {
    Application,
    EDeviceHealth,
    EPublicationListConfig,
    ESubscriptionListConfig,
    Health,
    IContainerConfig,
    IOI4ApplicationResources,
    ISubscriptionListObject,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList, Resource,
    RTLicense
} from '@oi4/oi4-oec-service-model';

import {
    EOPCUALocale,
    IOPCUADataSetMetaData,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';
import {existsSync, readFileSync} from 'fs';
import {ConfigFiles, MAMPathSettings} from '../Config/MAMPathSettings';

/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends ConfigParser implements IOI4ApplicationResources {
    public oi4Id: string; // TODO: doubling? Not needed here
    private readonly _profile: Profile;
    private readonly _mam: MasterAssetModel;
    private _health: Health;
    private _brokerState: boolean;
    private _license: License[];
    private _licenseText: Map<string, LicenseText>;
    private _rtLicense: RTLicense;
    private _publicationList: PublicationList[];
    private _subscriptionList: ISubscriptionListObject[];

    /**
     * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
     * */
    constructor(mamFile = `${MAMPathSettings.CONFIG_DIRECTORY}${ConfigFiles.mam}`) {
        super();

        this._mam = OI4ApplicationResources.extractMamFile(mamFile); // Import MAM from JSON

        if (this.mam === undefined) {
            throw Error('MAM File not found');
        }

        this.mam.Description.locale = EOPCUALocale.enUS; // Fill in container-specific values
        this.mam.SerialNumber = os.hostname();
        this.mam.ProductInstanceUri = `${this.mam.ManufacturerUri}/${encodeURIComponent(this.mam.Model.text)}/${encodeURIComponent(this.mam.ProductCode)}/${encodeURIComponent(this.mam.SerialNumber)}`;

        this.oi4Id = this.mam.ProductInstanceUri;

        this.brokerState = false;

        this._profile = new Profile(Application.mandatory);

        this.health = new Health(EDeviceHealth.NORMAL_0, 100);

        this._licenseText = new Map<string, LicenseText>();
        this.rtLicense = new RTLicense();

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
            } as PublicationList);

            this.addSubscription({
                topicPath: `oi4/${this.mam.DeviceClass}/${this.oi4Id}/get/${resources}/${this.oi4Id}`,
                interval: 0,
                config: ESubscriptionListConfig.NONE_0,
            });
        }

    }

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUADataSetMetaData>;

    private static extractMamFile(path: string): MasterAssetModel {
        if (existsSync(path)) {
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

    set health(health: Health) {
        if (health.healthScore >= 100 && health.healthScore <= 0) throw new RangeError('healthState out of range');
        this._health = health;
        this.emit('resourceChanged', 'health');
    }

    setHealthState(healthState: number) {
        if (healthState >= 100 && healthState <= 0) throw new RangeError('healthState out of range');
        this._health = new Health(this._health.health, healthState)
        this.emit('resourceChanged', 'health');
    }

    setHealth(health: EDeviceHealth) {
        this._health = new Health(health, this._health.healthScore);
        this.emit('resourceChanged', 'health');
    }

    // --- MAM ---

    get mam(): MasterAssetModel {
        return this._mam;
    }

    // --- Profile ---
    get profile(): Profile {
        return this._profile;
    }

    // --- License ---

    get license(): License[] {
        return this._license;
    }

    getLicense(oi4Id: string, licenseId?: string): License[] {
        if (oi4Id === undefined) {
            return this.license;
        } else if (oi4Id !== this.oi4Id) {
            throw new Error('Sub resources not yet implemented');
        }

        if (licenseId === undefined) {
            return this.license;
        }

        return this.license.filter((elem: License) => elem.licenseId === licenseId ? elem : null);
    }

    private set license(license) {
        this._license = license
    }

    // --- LicenseText ---
    get licenseText(): Map<string, LicenseText> {
        return this._licenseText;
    }

    private set licenseText(licenseText) {
        this._licenseText = licenseText;
    }

    // --- rtLicense ---
    get rtLicense(): RTLicense {
        return this._rtLicense;
    }

    private set rtLicense(rtLicense) {
        this._rtLicense = rtLicense;
    }

    // --- publicationList ---
    get publicationList(): PublicationList[] {
        return this._publicationList;
    }

    private set publicationList(publicationList) {
        this._publicationList = publicationList;
    }

    getPublicationList(oi4Id: string, resourceType: Resource, tag: string): PublicationList[] {
        console.log('getPublicationList called but not yet implemented', oi4Id, resourceType, tag);
        return [];
    }

    addPublication(publicationObj: PublicationList): void {
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

export {OI4ApplicationResources, IContainerConfig, RTLicense};
