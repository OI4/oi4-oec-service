import {Resources} from './model/Resources';
import {Oi4Identifier} from './model/Oi4Identifier';

/**
 * This class handles the creation and management of the DataSetWriterId.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DataSetWriterIdManager {
    const dataSetWriterIds: Map<string, number> = new Map<string, number>();
    let lastDataSetMessageId = 9;


    function nextDataSetWriterId(): number {
        return ++ lastDataSetMessageId;
    }

    function getDataSetWriterIdKey(resource: Resources, source: Oi4Identifier): string {
        const sub = (resource === Resources.PUBLICATION_LIST ||  resource === Resources.SUBSCRIPTION_LIST) ? 'NA' : source;
        return `${resource}_|_${sub}`;
    }

    /**
     * Returns the next DataSetWriterId for the matching resource and sub resource combination.
     */
    export function getDataSetWriterId(resource: Resources, source: Oi4Identifier): number {
        const key = getDataSetWriterIdKey(resource, source);
        if(!dataSetWriterIds.has(key)){
            dataSetWriterIds.set(key, nextDataSetWriterId());
        }
        return dataSetWriterIds.get(key);
    }

    export function resetDataSetWriterIdManager(): void {
        dataSetWriterIds.clear();
        lastDataSetMessageId = -1;
    }
}
