import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes,
    Methods,
    Resources
} from '@oi4/oi4-oec-service-model';

export const oi4Namespace = 'Oi4';

export class TopicInfo {

    public topic: string;
    public appId: Oi4Identifier;
    public method: Methods;
    public resource: Resources;
    public oi4Id: Oi4Identifier;
    public category?: string;
    public serviceType: ServiceTypes;
    public tag?: string;
    public filter?: string;
    public licenseId?: string;
    public source?: Oi4Identifier;
}

export type TopicWrapper = {
    topicArray: Array<string>;
    topicInfo: TopicInfo;
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
