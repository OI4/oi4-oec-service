import {
    Application,
    EDeviceHealth,
    Health, IContainerConfig,
    IOI4Resource,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    PublicationListConfig, Resource,
    RTLicense,
    SubscriptionList,
    SubscriptionListConfig
} from '@oi4/oi4-oec-service-model';
import {EventEmitter} from 'events';

export class OI4Resource extends EventEmitter implements IOI4Resource {
    protected readonly _profile: Profile;
    protected readonly _mam: MasterAssetModel;
    protected _health: Health;
    protected _config: IContainerConfig;
    protected _license: License[];
    protected _licenseText: Map<string, LicenseText>;
    protected _rtLicense: RTLicense;
    protected _publicationList: PublicationList[];
    protected _subscriptionList: SubscriptionList[];

    constructor(mam: MasterAssetModel) {
        super();

        this._mam = mam;;

        this._profile = new Profile(Application.mandatory);

        this.health = new Health(EDeviceHealth.NORMAL_0, 100);

        this._license = [];
        this._licenseText = new Map<string, LicenseText>();
        this._rtLicense = new RTLicense();

        this._publicationList = []

        this._subscriptionList = []

        // Fill both pubList and subList
        for (const resources of this.profile.resource) {
            let resInterval = 0;
            if (resources === 'health') {
                resInterval = 60000;
            } else {
                resInterval = 0;
            }

            this._publicationList.push({
                resource: resources,
                subResource: this.oi4Id,
                DataSetWriterId: 0,
                oi4Identifier: this.oi4Id,
                interval: resInterval,
                config: PublicationListConfig.NONE_0,
            } as PublicationList);

            this._subscriptionList.push(SubscriptionList.clone({
                topicPath: `oi4/${this.mam.DeviceClass}/${this.oi4Id}/get/${resources}/${this.oi4Id}`,
                interval: 0,
                config: SubscriptionListConfig.NONE_0,
            } as SubscriptionList));
        }
    }

    get oi4Id(): string {
        return this.mam.ProductInstanceUri;
    }

    // Resource accessor section
    // --- Config ---
    get config(): IContainerConfig {
        return this._config;
    }

    set config(config: IContainerConfig) {
        this._config = config;
    }

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

    getPublicationList(oi4Id?: string, resourceType?: Resource, tag?: string): PublicationList[] {
        return this._publicationList.filter((elem: PublicationList) => {
            if (oi4Id !== undefined && elem.oi4Identifier !== oi4Id) return false;
            if (resourceType !== undefined && elem.resource !== resourceType) return false;
            if (tag !== undefined && elem.filter !== tag) return false;
            return true;
        });
    }

    getSubscriptionList(oi4Id?: string, resourceType?: Resource, tag?: string): SubscriptionList[] {
        console.log(`subscriptionList elements make no sense and further specification by the OI4 working group ${oi4Id}, ${resourceType}, ${tag}`);
        return this._subscriptionList;
    }

    addPublication(publicationObj: PublicationList): void {
        this.publicationList.push(publicationObj);
        this.emit('resourceChanged', 'publicationList');
    }

    // --- subscriptionList ---
    get subscriptionList(): SubscriptionList[] {
        return this._subscriptionList;
    }

    private set subscriptionList(subscriptionList) {
        this._subscriptionList = subscriptionList;
    }

    addSubscription(subscriptionObj: SubscriptionList): void {
        this.subscriptionList.push(subscriptionObj);
        this.emit('resourceChanged', 'subscriptionList');
    }

}

export const extractProductInstanceUri = (mam: MasterAssetModel) => `${mam.ManufacturerUri}/${encodeURIComponent(mam.Model.text)}/${encodeURIComponent(mam.ProductCode)}/${encodeURIComponent(mam.SerialNumber)}`;
