import {IOPCUAPayload} from "@oi4/oi4-oec-service-opcua-model";

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

//FIXME find a better name
export type SendResourceCreatePayloadResult = {
    abortSending: boolean;
    payload: IOPCUAPayload[];
}