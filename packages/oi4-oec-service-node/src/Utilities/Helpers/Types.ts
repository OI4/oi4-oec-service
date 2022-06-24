import {IOPCUANetworkMessage, IOPCUAPayload} from '@oi4/oi4-oec-service-opcua-model';

export type ValidatedFilter = {
    isValid: boolean;
    dswidFilter: number;
}

export type ValidatedPayload = {
    abortSending: boolean;
    payload: IOPCUAPayload[];
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
    filter: string;
}
