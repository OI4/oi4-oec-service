import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes,
    Methods,
    Resources
} from '@oi4/oi4-oec-service-model';

export const oi4Namespace = 'Oi4';

export interface ITopicInfo {
    serviceType: ServiceTypes;
    appId: Oi4Identifier;
    method: Methods;
    resource: Resources;
    category?: string;
    source?: Oi4Identifier;
    filter?: string;

    toString(): string;
}

export class TopicInfo implements ITopicInfo {
    public serviceType: ServiceTypes;
    public appId: Oi4Identifier;
    public method: Methods;
    public resource: Resources;
    public category?: string;
    public source?: Oi4Identifier;
    public filter?: string;
    public tag?: string;
    public licenseId?: string;

    constructor(serviceType: ServiceTypes, appId: Oi4Identifier, method: Methods, resource: Resources, source?: Oi4Identifier, filter?: string) {
        this.appId = appId;
        this.method = method;
        this.resource = resource;
        this.serviceType = serviceType;
        this.source = source;
        this.filter = filter;
    }

    public toString(): string {
        const getOptional = (part: string): string => part !== undefined ? `/${part}` : '';
        return `${oi4Namespace}/${this.serviceType}/${this.appId.toString()}/${this.method}/${this.resource}${getOptional(this.source?.toString())}${getOptional(this.filter)}`;
    }
}

export type TopicWrapper = {
    topicArray: Array<string>;
    topicInfo: TopicInfo;
    raw: string;
}

export function getTopicMethod(method: string): Methods {
    switch (method) {
        case Methods.GET:
            return Methods.GET;
        case Methods.PUB:
            return Methods.PUB;
        case Methods.SET:
            return Methods.SET;
        case Methods.DEL:
            return Methods.DEL;
        case Methods.CALL:
            return Methods.CALL;
        case Methods.REPLY:
            return Methods.REPLY;
        default:
            throw new Error(`Unknown method: ${method}`);
    }
}

//FIXME find a better name
export type ValidatedIncomingMessageData = {
    areValid: boolean;
    parsedMessage: IOPCUANetworkMessage;
    topicInfo: TopicInfo;
}

export type ValidatedFilter = {
    isValid: boolean;
    dswidFilter: number;
}

export type ValidatedPayload = {
    abortSending: boolean;
    payload: IOPCUADataSetMessage[];
}
