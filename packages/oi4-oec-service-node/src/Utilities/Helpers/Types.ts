import {IOPCUADataSetMessage, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';

export type ValidatedFilter = {
    isValid: boolean;
    filter: string;
}

export type ValidatedPayload = {
    abortSending: boolean;
    payload: IOPCUADataSetMessage[];
}

export type ValidatedMessage = {
    isValid: boolean;
    parsedMessage: IOPCUANetworkMessage;
}

//FIXME find a better name
export type ValidatedIncomingMessageData = {
    areValid: boolean;
    parsedMessage: IOPCUANetworkMessage;
    topicInfo: TopicInfo;

}

export type TopicInfo = {
    topic: string;
    appId: string;
    method: string;
    resource: string;
    subResource?: string;
    filter?: string;
}