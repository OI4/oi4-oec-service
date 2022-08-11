import {
    Health,
    IContainerConfig,
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
import {OI4Resource, OI4ResourceEvent} from "./OI4Resource";
import os from "os";
import path = require('path');

export const DEFAULT_MAM_FILE = '/etc/oi4/config/mam.json';

/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends OI4Resource implements IOI4ApplicationResources {
    readonly subResources: Map<string, IOI4Resource>;
    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUADataSetMetaData>;

    /**
     * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
     * */
    constructor(mamFile = DEFAULT_MAM_FILE) {
        super(OI4ApplicationResources.extractMamFile(mamFile));

        this.subResources = new Map<string, IOI4Resource>();

        this.dataLookup = {};
        this.metaDataLookup = {};

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
                subResource: this.oi4Id.toString(),
                DataSetWriterId: 0,
                oi4Identifier: this.oi4Id,
                interval: resInterval,
                config: PublicationListConfig.NONE_0,
            } as PublicationList);

            this._subscriptionList.push(SubscriptionList.clone({
                topicPath: `oi4/${this.mam.getServiceType()}/${this.oi4Id}/get/${resources}/${this.oi4Id}`,
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
        return this.subResources.get(oi4Id.toString()).mam;
    }

    public getHealth(oi4Id: Oi4Identifier): Health {
        // TODO check why oi4Id is escaped and this.oi4Id is not
        if(this.oi4Id.equals(oi4Id)) {
            return this.health;
        }
        return this.subResources.get(oi4Id.toString())?.health;
    }

    getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[] {
        if (oi4Id === undefined) {
            return this.license;
        } 
        
        const license = oi4Id.equals(this.oi4Id) ? this.license : this.subResources.get(oi4Id.toString())?.license;
        if (license === undefined) {
            return [];
        }

        if (licenseId === undefined) {
            return license;
        }

        return license.filter((elem: License) => elem.licenseId === licenseId ? elem : null);
    }

    hasSubResource(oi4Id: Oi4Identifier): boolean {
        return this.subResources.has(oi4Id.toString());
    }

    getSubResource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource> {
        if(oi4Id !== undefined) {
            return this.subResources.get(oi4Id.toString());
        }
        return this.subResources.values();
    }

    addSubResource(subResource: IOI4Resource): void {
        this.subResources.set(subResource.oi4Id.toString(), subResource);
        // TODO add sub resource to publication and subscription list
        this.emit(OI4ResourceEvent.RESOURCE_ADDED, subResource.oi4Id);
    }

    removeSubResource(oi4Id: Oi4Identifier): boolean {
        this.emit(OI4ResourceEvent.RESOURCE_REMOVED, oi4Id);
        return this.subResources.delete(oi4Id.toString());
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
}

export {OI4ApplicationResources, IContainerConfig, RTLicense};
