export interface IEvent {
    origin: string;
    number: number;
    description?: string;
    category: EventCategory;
    details?: any;
}

export interface INamurNe107Event extends IEvent {
    details: {
        diagnosticCode?: string;
        location?: string;
    };
}

export interface ISyslogEvent extends IEvent {
    details: {
        MSG?: string;
        HEADER?: string;
    };
}

export interface IStatusEvent extends IEvent {
    details: {
        symbolicId?: string;
    };
}

export enum EventCategory {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_OPCSC_1 = 'CAT_OPCSC_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
}

export enum EventSubResource {
    SYSLOG = 'syslog',
    STATUS = 'status',
    NAMUR_NE107 = 'ne107',
    GENERIC = 'generic',
}
