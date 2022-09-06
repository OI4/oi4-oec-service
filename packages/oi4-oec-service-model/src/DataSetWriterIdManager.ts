import {Resource} from "./model/Resource";

/**
 * This class handles the creation and management of the DataSetWriterId.
 */
export namespace DataSetWriterIdManager {
    const dataSetWriterIds: Map<string, number> = new Map<string, number>();
    let lastDataSetMessageId = -1;

    /**
     * Returns the next DataSetWriterId for the matching resource and sub resource combination.
     */
    export function getDataSetWriterId(resource: Resource, source: string): number {
        const key = getDataSetWriterIdKey(resource, source);
        if(!dataSetWriterIds.has(key)){
            dataSetWriterIds.set(key, nextDataSetWriterId());
        }
        return dataSetWriterIds.get(key);
    }

    function nextDataSetWriterId(): number {
        return ++ lastDataSetMessageId;
    }

    function getDataSetWriterIdKey(resource: Resource, source: string): string {
        const sub = (resource === Resource.PUBLICATION_LIST ||  resource === Resource.SUBSCRIPTION_LIST) ? "NA" : source;
        return `${resource}_|_${sub}`;
    }

    export function resetDataSetWriterIdManager(): void {
        dataSetWriterIds.clear();
        lastDataSetMessageId = -1;
    }
}
