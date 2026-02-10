import {
    EDeviceHealth,
    Health,
    IContainerConfig,
    IOI4Resource,
    MasterAssetModel,
    Oi4Identifier,
    OI4ResourceDefinition,
    OI4ResourceEvent,
    Profile,
    profileApplication,
    PublicationList,
    Resources,
    SubscriptionList,
    TypedEventEmitter,
} from '@oi4/oi4-oec-service-model';
import {ReferenceDesignation} from '@oi4/oi4-oec-service-model/dist/model/resources/ReferenceDesignation';

export class OI4Resource implements IOI4Resource {
    readonly eventEmitter: TypedEventEmitter<OI4ResourceDefinition>;

    protected readonly _profile: Profile;
    protected readonly _mam: MasterAssetModel;
    protected _health: Health;
    protected _config: IContainerConfig;
    protected _publicationList: PublicationList[];
    protected _subscriptionList: SubscriptionList[];
    protected _referenceDesignation: ReferenceDesignation;

    constructor(mam: MasterAssetModel, eventEmitter: TypedEventEmitter<OI4ResourceDefinition>) {
        this.eventEmitter = eventEmitter;

        this._mam = mam;

        this._profile = new Profile(profileApplication.mandatory);

        this.health = new Health(EDeviceHealth.NORMAL_0, 100);

        this._publicationList = []

        this._subscriptionList = []
    }

    emit(event: OI4ResourceEvent, oi4Id: Oi4Identifier, resource: Resources): boolean {
        return this.eventEmitter.emit(event, oi4Id, resource);
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
    get health(): Health {
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

    // --- ReferenceDesignation ---
    get referenceDesignation(): ReferenceDesignation {
        return this._referenceDesignation;
    }

    set referenceDesignation(referenceDesignation: ReferenceDesignation) {
        this._referenceDesignation = referenceDesignation;
        this.emit(OI4ResourceEvent.RESOURCE_CHANGED, this.oi4Id, Resources.REFERENCE_DESIGNATION);
    }

    // --- Profile ---
    get profile(): Profile {
        return this._profile;
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
            return !(tag !== undefined && elem.Filter !== tag);

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
