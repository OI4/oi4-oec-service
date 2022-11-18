import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes,
    Methods,
    Resources
} from '@oi4/oi4-oec-service-model';

export const oi4Namespace = 'Oi4';

export type TopicInfo = {
    topic: string;
    appId: Oi4Identifier;
    method: Methods;
    resource: Resources;
    oi4Id: Oi4Identifier;
    category?: string;
    serviceType: ServiceTypes;
    tag?: string;
    filter?: string;
    licenseId?: string;
    source?: string;
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
