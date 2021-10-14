export interface IConformity {
  oi4Id: EValidity;
  resource: IValidityLookup;
  checkedResourceList: string[];
  profileResourceList: string[];
  nonProfileResourceList: string[];
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

interface IValidityLookup {
  [key: string]: IValidityDetails;
}

export interface IValidityDetails {
  validity: EValidity;
  dataSetMessages: any[];
  validityErrors: unknown[]; // string to unknown
}

export enum EValidity {
  default = 0,
  ok = 1,
  partial = 2,
  nok = 3,
}
