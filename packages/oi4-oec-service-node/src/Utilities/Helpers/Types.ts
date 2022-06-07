import {IOPCUAPayload} from '@oi4/oi4-oec-service-opcua-model';

export type Credentials = {
    username: string;
    password: string;
}

export type ServerObject = {
    host: string;
    port: number;
}

export type ValidatedFilter = {
    isValid: boolean;
    dswidFilter: number;
}

export type ValidatedPayload = {
    abortSending: boolean;
    payload: IOPCUAPayload[];
}

export type TopicInfo = {
    appId: string;
    method: string;
    resource: string;
    filter: string;
}