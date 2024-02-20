import {OI4Payload} from '../Payload';
import {Oi4Identifier} from '../Oi4Identifier';
import {Resources} from '../Resources';

export class PublicationList implements OI4Payload {
    Resource: Resources;
    Source: Oi4Identifier;
    Filter?: string;
    DataSetWriterId: number; // Actually OI4-Identifier: TODO: Validator
    Mode: PublicationListMode;
    Interval?: number; // UINT32
    Precisions?: number; // REAL
    Config?: PublicationListConfig;

    resourceType(): Resources {
        return Resources.PUBLICATION_LIST;
    }

    static clone(source: PublicationList): PublicationList {
        const copy = new PublicationList();
        Object.assign(copy, source);
        return copy;
    }
}

export enum PublicationListMode {
    OFF_0 = 'OFF_0',
    ON_REQUEST_1 = 'ON_REQUEST_1',
    APPLICATION_2 = 'APPLICATION_2',
    SOURCE_3 = 'SOURCE_3',
    FILTER_4 = 'FILTER_4',
    APPLICATION_SOURCE_5 = 'APPLICATION_SOURCE_5',
    APPLICATION_FILTER_6 = 'APPLICATION_FILTER_6',
    SOURCE_FILTER_7 = 'SOURCE_FILTER_7',
    APPLICATION_SOURCE_FILTER_8 = 'APPLICATION_SOURCE_FILTER_8',
}

export enum PublicationListConfig {
    NONE_0 = 'NONE_0',
    MODE_1 = 'MODE_1',
    INTERVAL_2 = 'INTERVAL_2',
    MODE_AND_INTERVAL_3 = 'MODE_AND_INTERVAL_3',
}
