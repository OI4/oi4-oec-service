import {OI4Payload} from './Payload';
import {Resources} from './Resources';

export enum EventCategory {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_STATUS_1 = 'CAT_STATUS_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
}

export enum EventFilter {
    Syslog = 'Syslog',
    Status = 'Status',
    Ne107 = 'Ne107',
    Generic = 'Generic',
}

export interface IEvent extends OI4Payload {
    Number: number;
    Description?: string;
    readonly Category: EventCategory;
    Details?: any;
}

export abstract class BaseEvent implements IEvent {
    Description: string;
    Number: number;
    abstract readonly Category: EventCategory;
    abstract Details: any;

    constructor(number: number, description?: string) {
        this.Number = number;
        this.Description = description;
    }

    resourceType(): Resources {
        return Resources.EVENT;
    }
}

export class SyslogEvent extends BaseEvent {
    Category: EventCategory = EventCategory.CAT_SYSLOG_0;

    Details: {
        MSG?: string;
        HEADER?: string;
    };
}

export class StatusEvent extends BaseEvent {
    Category: EventCategory = EventCategory.CAT_STATUS_1;

    Details: {
        SymbolicId?: string;
    };
}

export class NamurNE107Event extends BaseEvent {
    Category: EventCategory = EventCategory.CAT_NE107_2;

    Details: {
        DiagnosticCode?: string;
        Location?: string;
    };
}

export class GenericEvent extends BaseEvent {
    Category: EventCategory = EventCategory.CAT_GENERIC_99;

    Details: any;
}
