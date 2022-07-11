import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';

export interface IGetRequest {
    topicPreamble: string;
    resource: string;
    subResource? : string;
    filter?: string;
    message: IOPCUANetworkMessage;
}

export interface IPubResponse {
    topic: string;
    rawMessage: Buffer;
}

export interface IMessageBusLookup {
    getMessage(getRequest: IGetRequest): Promise<IPubResponse>;
}
