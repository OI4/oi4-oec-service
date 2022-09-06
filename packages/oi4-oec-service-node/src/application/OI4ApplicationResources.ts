import {
    Health,
    IContainerConfig,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IContainerConfigValidation,
    IOI4ApplicationResources,
    IOI4Resource,
    MasterAssetModel,
    PublicationList,
    PublicationListConfig,
    RTLicense,
    SubscriptionList,
    SubscriptionListConfig,
    License
} from '@oi4/oi4-oec-service-model';

import {
    IOPCUADataSetMetaData,
    IOPCUAMetaData,
    IOPCUANetworkMessage,
    Oi4Identifier
} from '@oi4/oi4-oec-service-opcua-model';
import {existsSync, readFileSync} from 'fs';
import {OI4Resource, OI4ResourceEvent} from './OI4Resource';
import os from 'os';
import path = require('path');
import { Resource } from '@oi4/oi4-oec-service-model';

export const DEFAULT_MAM_FILE = '/etc/oi4/config/mam.json';

/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends OI4Resource implements IOI4ApplicationResources {
    readonly Source: Map<string, IOI4Resource>;
    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUADataSetMetaData>;

    /**
     * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
     * */
    constructor(mamFile = DEFAULT_MAM_FILE) {
        super(OI4ApplicationResources.extractMamFile(mamFile));

        this.Source = new Map<string, IOI4Resource>();

        this.dataLookup = {};
        this.metaDataLookup = {};

        // Fill both pubList and subList
        for (const resources of this.profile.resource) {
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
                topicPath: `Oi4/${this.mam.getServiceType()}/${this.oi4Id}/Get/${resources}/${this.oi4Id}`,
                interval: 0,
                config: SubscriptionListConfig.NONE_0,
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
        if(oi4Id.equals(this.oi4Id)) {
            return this.mam;
        }
        return this.Source.get(oi4Id.toString()).mam;
    }

    public getHealth(oi4Id: Oi4Identifier): Health {
        // TODO check why oi4Id is escaped and this.oi4Id is not
        if(this.oi4Id.equals(oi4Id)) {
            return this.health;
        }
        return this.Source.get(oi4Id.toString())?.health;
    }

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[] {
        if (oi4Id === undefined) {
            return this.license;
        } 
        
        const license = oi4Id.equals(this.oi4Id) ? this.license : this.Source.get(oi4Id.toString())?.license;
        if (license === undefined) {
            return [];
        }

        if (licenseId === undefined) {
            return license;
        }

        return license.filter((elem: License) => elem.licenseId === licenseId ? elem : null);
    }

    setConfig(oi4Id: Oi4Identifier, filter: string, config: IContainerConfig): boolean {
        // search existing config
        let currentConfig: IContainerConfig = undefined;
        if (this.oi4Id.equals(oi4Id)) {
            currentConfig = this.config;
        } 
        else if (this.hasSubResource(oi4Id)) {
            const subResource = this.getSubResource(oi4Id) as IOI4Resource;
            currentConfig = subResource?.config;
        }

        if (!currentConfig) {
            // no existing config found --> add
            if (this.oi4Id.equals(oi4Id)) {
                this.config = config;
            } else if (this.hasSubResource(oi4Id)) {
                const subResource = this.getSubResource(oi4Id) as IOI4Resource;
                subResource.config = config;
            }
            else { return false; }

            this.emit(OI4ResourceEvent.RESOURCE_ADDED, oi4Id, Resource.CONFIG);
            return true; 
        }

        // update existing config:

        if (!filter) {
            // filter is mandatory when updating the configuration
            return false;
        }

        if ('context' in currentConfig && encodeURIComponent(currentConfig['context'].name.text) !== filter) {
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
                if (oldSetting && this.validateConfigValue(newSetting.value, oldSetting.validation)) {
                    oldSetting.value = newSetting.value; // currently we only accept a new value
                    configUpdated = true;
                }
            }
        }

        if (configUpdated) {
            this.emit(OI4ResourceEvent.RESOURCE_CHANGED, oi4Id, Resource.CONFIG);
            return true;
        }

        return false;
    }

    hasSource(oi4Id: Oi4Identifier): boolean {
        return this.Source.has(oi4Id.toString());
    }

    getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource> {
        if(oi4Id !== undefined) {
            return this.Source.get(oi4Id.toString());
        }
        return this.Source.values();
    }

    addSource(source: IOI4Resource): void {
        this.Source.set(source.oi4Id.toString(), source);
        // TODO add sub resource to publication and subscription list
        this.emit(OI4ResourceEvent.RESOURCE_ADDED, source.oi4Id);
    }

    removeSource(oi4Id: Oi4Identifier): boolean {
        this.emit(OI4ResourceEvent.RESOURCE_REMOVED, oi4Id);
        return this.Source.delete(oi4Id.toString());
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

    private validateConfigValue(value: string, validation?: IContainerConfigValidation): boolean {
        if (!validation) {
            return true;
        }

        if (validation.length !== undefined && value.length > validation.length)  {
            return false; 
        } 

        if (validation.min !== undefined && Number(value) < validation.min) {
            return false;
        }

        if (validation.max !== undefined && Number(value) > validation.max) { 
            return false;
        }

        if (validation.pattern !== undefined) {
            const regexp = new RegExp(validation.pattern);
            if (!regexp.test(value)) {
                return false;
            }
        }

        if (validation.values != undefined && !validation.values.includes(value)) {
            return false;
        }

        return true;
    }
}

export {OI4ApplicationResources, IContainerConfig, RTLicense};
