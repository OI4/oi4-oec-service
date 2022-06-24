export interface IEvent {
    origin: string;
    number: number;
    description?: string;
    category: EventCategory;
    details?: any;
}

export interface IStatusEvent extends IEvent {
    details: {
        symbolicId?: string;
    };
}

export interface ISyslogEvent extends IEvent {
    details: {
        MSG?: string;
        HEADER?: string;
    };
}

export enum EventCategory {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_OPCSC_1 = 'CAT_OPCSC_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
}
