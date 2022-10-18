import {OI4Payload} from './Payload';
import {Resource} from "./Resource";

export enum EventCategory {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_STATUS_1 = 'CAT_STATUS_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
}

export interface IEvent extends OI4Payload {
    origin: string;
    number: number;
    description?: string;
    readonly category: EventCategory;
    details?: any;
    subResource(): string;
}

export abstract class BaseEvent implements IEvent {
    description: string;
    number: number;
    origin: string;

    constructor(origin: string, number: number, description?: string) {
        this.origin = origin;
        this.number = number;
        this.description = description;
    }

    resourceType() {
        return Resource.EVENT;
    }

    abstract readonly category: EventCategory;
    abstract details: any;
    abstract subResource(): string;
}


export class SyslogEvent extends BaseEvent {
    category: EventCategory.CAT_SYSLOG_0;

    constructor(origin: string, number: number, description?: string) {
        super(origin, number, description);
    }

    subResource(): string {
        return 'syslog';
    };
    details: {
        MSG?: string;
        HEADER?: string;
    };
}

export class StatusEvent extends BaseEvent {
    category: EventCategory.CAT_STATUS_1;

    constructor(origin: string, number: number, description?: string) {
        super(origin, number, description);
    }

    subResource(): string {
        return 'status';
    }

    details: {
        symbolicId?: string;
    };
}

export class NamurNE107Event extends BaseEvent {
    category: EventCategory.CAT_NE107_2;

    constructor(origin: string, number: number, description?: string) {
        super(origin, number, description);
    }

    subResource(): string {
        return 'ne107';
    };
    details: {
        diagnosticCode?: string;
        location?: string;
    };
}

export class GenericEvent extends BaseEvent {
    category: EventCategory.CAT_GENERIC_99;
    subResource(): string {
        return 'generic';
    };
    details: any;
}
