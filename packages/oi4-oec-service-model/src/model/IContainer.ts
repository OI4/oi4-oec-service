// TODO move config interfaces to Resouces.ts and replace them by classes
// Common Container config interfaces
import {IOPCUALocalizedText} from '../opcua/model/IOPCUA';
import {EOPCUABaseDataType} from '../opcua/model/EOPCUA';

export type IContainerConfig = Record<string, IContainerConfigGroupName | IContainerConfigContext>;

export interface IContainerConfigContext {
  Name: IOPCUALocalizedText;
  Description?: IOPCUALocalizedText;
}

export interface IContainerConfigGroupName extends Record<string, IContainerConfigConfigName | IOPCUALocalizedText | undefined>{
  Name: IOPCUALocalizedText;
  Description?: IOPCUALocalizedText;
}

export interface IContainerConfigConfigName {
  Type: EOPCUABaseDataType;
  Value: string; // This depends on the specified type
  Unit?: string;
  DefaultValue?: string;
  Mandatory?: boolean;
  Sensitive? : boolean;
  Name: IOPCUALocalizedText;
  Description?: IOPCUALocalizedText;
  Validation?: IContainerConfigValidation;
}

export interface IContainerConfigValidation {
  Length?: number;
  Min?: number;
  Max?: number;
  Pattern?: string;
  Values?: string[];
}
