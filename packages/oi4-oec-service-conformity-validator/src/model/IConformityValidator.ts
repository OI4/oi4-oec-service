import {IOPCUADataSetMessage, Resources} from '@oi4/oi4-oec-service-model';

export interface IConformity {
    oi4Id: EValidity;
    resources: Record<string, IValidityDetails>;
    checkedResourceList: Resources[];
    profileResourceList: Resources[];
    nonProfileResourceList: Resources[];
    validity: EValidity;
}

export interface ISchemaConformity {
    schemaResult: boolean;
    networkMessage: ISchemaResult;
    payload: ISchemaResult;
}

interface ISchemaResult {
    schemaResult: boolean;
    resultMsgArr: string[];
}

export interface IValidityDetails {
    validity: EValidity;
    dataSetMessages: IOPCUADataSetMessage[];
    validityErrors: unknown[]; // string to unknown
}

export enum EValidity {
    default = 0,
    ok = 1,
    partial = 2,
    nok = 3,
}
