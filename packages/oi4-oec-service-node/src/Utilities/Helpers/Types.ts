import {
    IOPCUADataSetMessage,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes
} from '@oi4/oi4-oec-service-opcua-model';
import {Resource} from "@oi4/oi4-oec-service-model";
import {TopicMethods} from "./Enums";

export type ValidatedFilter = {
    isValid: boolean;
    dswidFilter: number;
}

export type ValidatedPayload = {
    abortSending: boolean;
    payload: IOPCUADataSetMessage[];
}

//FIXME find a better name
export type ValidatedIncomingMessageData = {
    areValid: boolean;
    parsedMessage: IOPCUANetworkMessage;
    topicInfo: TopicInfo;
}

export type TopicInfo = {
    topic: string;
    appId: Oi4Identifier;
    method: TopicMethods;
    resource: Resource;
    oi4Id: Oi4Identifier;
    category?: string;
    serviceType: ServiceTypes;
    tag?: string;
    filter?: string;
    licenseId?: string;
    subResource?: string;
}

export type TopicWrapper = {
    topicArray: Array<string>;
    topicInfo: TopicInfo;
}
