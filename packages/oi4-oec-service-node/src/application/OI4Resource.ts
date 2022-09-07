import {
    Application,
    EDeviceHealth,
    Health,
    IContainerConfig,
    IOI4Resource,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resources,
    RTLicense,
    SubscriptionList,
} from '@oi4/oi4-oec-service-model';
import {EventEmitter} from 'events';
import {Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';

export enum OI4ResourceEvent {
    RESOURCE_CHANGED = 'resourceChanged',
    RESOURCE_ADDED = 'resourceChanged',
    RESOURCE_REMOVED = 'resourceRemoved',
}

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

        this._mam = mam;

        this._profile = new Profile(Application.mandatory);

        this.health = new Health(EDeviceHealth.NORMAL_0, 100);

        this._license = [];
        this._licenseText = new Map<string, LicenseText>();
        this._rtLicense = new RTLicense();

        this._publicationList = []

        this._subscriptionList = []
    }

    get oi4Id(): Oi4Identifier {
        return this.mam.getOI4Id();
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
        if (health.HealthScore >= 100 && health.HealthScore <= 0) throw new RangeError('healthState out of range');
        this._health = health;
        this.emit(OI4ResourceEvent.RESOURCE_CHANGED, this.oi4Id, Resources.HEALTH);
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

    getPublicationList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): PublicationList[] {
        return this._publicationList.filter((elem: PublicationList) => {
            if (oi4Id !== undefined && !oi4Id.equals(elem.Source)) return false;
            if (resourceType !== undefined && elem.Resource !== resourceType) return false;
            if (tag !== undefined && elem.Filter !== tag) return false;
            return true;
        });
    }

    getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): SubscriptionList[] {
        console.log(`subscriptionList elements make no sense and further specification by the OI4 working group ${oi4Id}, ${resourceType}, ${tag}`);
        return this._subscriptionList;
    }

    addPublication(publicationObj: PublicationList): void {
        this.publicationList.push(publicationObj);
        this.emit(OI4ResourceEvent.RESOURCE_CHANGED, this.oi4Id, Resources.PUBLICATION_LIST);
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
        this.emit(OI4ResourceEvent.RESOURCE_CHANGED, this.oi4Id, Resources.SUBSCRIPTION_LIST);
    }

}

export const extractProductInstanceUri = (mam: MasterAssetModel) => `${mam.ManufacturerUri}/${encodeURIComponent(mam.Model.Text)}/${encodeURIComponent(mam.ProductCode)}/${encodeURIComponent(mam.SerialNumber)}`;
