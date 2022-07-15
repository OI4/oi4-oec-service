import {
    IContainerConfig,
    IOI4ApplicationResources, IOI4Resource,
    MasterAssetModel,
    RTLicense,
} from '@oi4/oi4-oec-service-model';

import {
    IOPCUADataSetMetaData,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {existsSync, readFileSync} from 'fs';
import {OI4Resource} from "./OI4Resource";
import os from "os";

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
    }

    private static extractMamFile(path: string): MasterAssetModel {
        if (existsSync(path)) {
            const mam = MasterAssetModel.clone(JSON.parse(readFileSync(path).toString()));
            mam.SerialNumber = os.hostname();
            return mam;
        }
        return undefined;
    }

    hasSubResource(oi4Id: string) {
        return this.subResources.has(oi4Id);
    }

    getSubResource(oi4Id?: string): IOI4Resource | IterableIterator<IOI4Resource> {
        if(oi4Id !== undefined) {
            return this.subResources.get(oi4Id);
        }
        return this.subResources.values();
    }

    setSubResource(oi4Id: string, subResource: IOI4Resource): void {
        this.subResources.set(oi4Id, subResource);
    }

    deleteSubResource(oi4Id: string): boolean {
        return this.subResources.delete(oi4Id);
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
