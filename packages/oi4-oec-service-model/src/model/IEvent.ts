import {OI4Payload} from './Payload';
import {Resources} from "./Resources";

export enum EventCategory {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_STATUS_1 = 'CAT_STATUS_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
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

    constructor(number: number, description?: string) {
        this.Number = number;
        this.Description = description;
    }

    resourceType() {
        return Resources.EVENT;
    }

    abstract readonly Category: EventCategory;
    abstract Details: any;
}


export class SyslogEvent extends BaseEvent {
    Category: EventCategory.CAT_SYSLOG_0;

    constructor(number: number, description?: string) {
        super(number, description);
    }

    Details: {
        MSG?: string;
        HEADER?: string;
    };
}

export class StatusEvent extends BaseEvent {
    Category: EventCategory.CAT_STATUS_1;

    constructor(number: number, description?: string) {
        super(number, description);
    }

    Details: {
        SymbolicId?: string;
    };
}

export class NamurNE107Event extends BaseEvent {
    Category: EventCategory.CAT_NE107_2;

    constructor(number: number, description?: string) {
        super(number, description);
    }

    Details: {
        DiagnosticCode?: string;
        Location?: string;
    };
}

export class GenericEvent extends BaseEvent {
    Category: EventCategory.CAT_GENERIC_99;

    Details: any;
}
