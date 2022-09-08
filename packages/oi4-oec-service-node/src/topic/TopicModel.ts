import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes
} from '@oi4/oi4-oec-service-opcua-model';
import {Resources} from '@oi4/oi4-oec-service-model';

export const OI4_NS = 'Oi4';

export type TopicInfo = {
    topic: string;
    appId: Oi4Identifier;
    method: TopicMethods;
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


export enum TopicMethods {
    GET = 'Get',
    PUB = 'Pub',
    SET = 'Set',
    DEL = 'Del',
    CALL  = 'Call',
    REPLY = 'Reply'
}

export function getTopicMethod(method: string) : TopicMethods {
    switch (method) {
        case TopicMethods.GET:
            return TopicMethods.GET;
        case TopicMethods.PUB:
            return TopicMethods.PUB;
        case TopicMethods.SET:
            return TopicMethods.SET;
        case TopicMethods.DEL:
            return TopicMethods.DEL;
        case TopicMethods.CALL:
            return TopicMethods.CALL;
        case TopicMethods.REPLY:
            return TopicMethods.REPLY;
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
