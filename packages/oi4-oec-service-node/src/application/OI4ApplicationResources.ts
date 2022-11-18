import {
    Health,
    IContainerConfig,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IContainerConfigValidation,
    IOI4ApplicationResources,
    IOI4Resource,
    IOPCUADataSetMetaData,
    IOPCUAMetaData,
    IOPCUANetworkMessage,
    License,
    MasterAssetModel,
    Oi4Identifier,
    PublicationList,
    PublicationListConfig,
    Resources,
    RTLicense,
    SubscriptionList,
    SubscriptionListConfig
} from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {OI4Resource, OI4ResourceEvent} from './OI4Resource';
import os from 'os';
import path = require('path');

export const defaultMAMFile = '/etc/oi4/config/mam.json';

/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends OI4Resource implements IOI4ApplicationResources {
    readonly sources: Map<string, IOI4Resource>;
    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUADataSetMetaData>;

    /**
     * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
     * */
    constructor(mamFile = defaultMAMFile) {
        super(OI4ApplicationResources.extractMamFile(mamFile));

        this.sources = new Map<string, IOI4Resource>();

        this.dataLookup = {};
        this.metaDataLookup = {};

        // Fill both pubList and subList
        for (const resources of this.profile.Resources) {
            let resInterval = 0;
            if (resources === 'Health') {
                resInterval = 60000;
            } else {
                resInterval = 0;
            }

            this._publicationList.push({
                Resource: resources,
                Source: this.oi4Id,
                DataSetWriterId: 0,
                Interval: resInterval,
                Config: PublicationListConfig.NONE_0,
            } as PublicationList);

            this._subscriptionList.push(SubscriptionList.clone({
                TopicPath: `Oi4/${this.mam.getServiceType()}/${this.oi4Id}/Get/${resources}/${this.oi4Id}`,
                Interval: 0,
                Config: SubscriptionListConfig.NONE_0,
            } as SubscriptionList));
        }
    }

    private static extractMamFile(filePath: string): MasterAssetModel {
        if (existsSync(filePath)) {
            const mam = MasterAssetModel.clone(JSON.parse(readFileSync(filePath, 'utf8')));
            mam.SerialNumber = os.hostname();
            mam.ProductInstanceUri = mam.getOI4Id().toString();
            return mam;
        }
        throw new Error(`MAM file ${path.resolve(filePath)} does not exist`);
    }

    get oi4Id(): Oi4Identifier {
        return this.mam.getOI4Id();
    }

    public getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel {
        if (oi4Id.equals(this.oi4Id)) {
            return this.mam;
        }
        return this.sources.get(oi4Id.toString()).mam;
    }

    public getHealth(oi4Id: Oi4Identifier): Health {
        // TODO check why oi4Id is escaped and this.oi4Id is not
        if (this.oi4Id.equals(oi4Id)) {
            return this.health;
        }
        return this.sources.get(oi4Id.toString())?.health;
    }

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[] {
        if (oi4Id === undefined) {
            return this.license;
        }

        const license = oi4Id.equals(this.oi4Id) ? this.license : this.sources.get(oi4Id.toString())?.license;
        if (license === undefined) {
            return [];
        }

        if (licenseId === undefined) {
            return license;
        }

        return license.filter((elem: License) => elem.LicenseId === licenseId ? elem : null);
    }

    setConfig(oi4Id: Oi4Identifier, filter: string, config: IContainerConfig): boolean {
        // search existing config
        let currentConfig: IContainerConfig = undefined;
        if (this.oi4Id.equals(oi4Id)) {
            currentConfig = this.config;
        } else if (this.hasSource(oi4Id)) {
            const subResource = this.getSource(oi4Id) as IOI4Resource;
            currentConfig = subResource?.config;
        }

        if (!currentConfig) {
            // no existing config found --> add
            if (this.oi4Id.equals(oi4Id)) {
                this.config = config;
            } else if (this.hasSource(oi4Id)) {
                const subResource = this.getSource(oi4Id) as IOI4Resource;
                subResource.config = config;
            } else {
                return false;
            }

            this.emit(OI4ResourceEvent.RESOURCE_ADDED, oi4Id, Resources.CONFIG);
            return true;
        }

        // update existing config:

        if (!filter) {
            // filter is mandatory when updating the configuration
            return false;
        }

        if ('context' in currentConfig && encodeURIComponent(currentConfig['context'].Name.Text) !== filter) {
            return false; // no matching filter
        }

        // apply changes
        let configUpdated = false;
        const ignoreList = ['name', 'Name', 'description', 'Description'];

        for (const groupName of Object.keys(config)) {
            for (const settingName of Object.keys(config[groupName])) {
                if (ignoreList.includes(settingName)) {
                    continue;
                }

                const oldSetting = (currentConfig[groupName] as IContainerConfigGroupName)?.[settingName] as IContainerConfigConfigName;
                const newSetting = (config[groupName] as IContainerConfigGroupName)[settingName] as IContainerConfigConfigName;
                if (oldSetting && OI4ApplicationResources.validateConfigValue(newSetting.Value, oldSetting.Validation)) {
                    oldSetting.Value = newSetting.Value; // currently we only accept a new value
                    configUpdated = true;
                }
            }
        }

        if (configUpdated) {
            this.emit(OI4ResourceEvent.RESOURCE_CHANGED, oi4Id, Resources.CONFIG);
            return true;
        }

        return false;
    }

    hasSource(oi4Id: Oi4Identifier): boolean {
        return this.sources.has(oi4Id.toString());
    }

    getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource> {
        if (oi4Id !== undefined) {
            return this.sources.get(oi4Id.toString());
        }
        return this.sources.values();
    }

    addSource(source: IOI4Resource): void {
        this.sources.set(source.oi4Id.toString(), source);
        // TODO add sub resource to publication and subscription list
        this.emit(OI4ResourceEvent.RESOURCE_ADDED, source.oi4Id);
    }

    removeSource(oi4Id: Oi4Identifier): boolean {
        this.emit(OI4ResourceEvent.RESOURCE_REMOVED, oi4Id);
        return this.sources.delete(oi4Id.toString());
        // TODO remove sub resource to publication and subscription list
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

    private static validateConfigValue(value: string, validation?: IContainerConfigValidation): boolean {
        if (!validation) {
            return true;
        }

        if (validation.Length !== undefined && value.length > validation.Length) {
            return false;
        }

        if (validation.Min !== undefined && Number(value) < validation.Min) {
            return false;
        }

        if (validation.Max !== undefined && Number(value) > validation.Max) {
            return false;
        }

        if (validation.Pattern !== undefined) {
            const regexp = new RegExp(validation.Pattern);
            if (!regexp.test(value)) {
                return false;
            }
        }

        return !(validation.Values != undefined && !validation.Values.includes(value));
    }
}

export {OI4ApplicationResources, IContainerConfig, RTLicense};
