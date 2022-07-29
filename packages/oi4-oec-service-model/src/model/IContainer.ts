import { EOPCUABaseDataType } from '@oi4/oi4-oec-service-opcua-model';
import { IOPCUALocalizedText } from '@oi4/oi4-oec-service-opcua-model';

// TODO move config interfaces to Resouce.ts and replace them by classes
// Common Container config interfaces
export type IContainerConfig = Record<string, IContainerConfigGroupName | IContainerConfigContext>;

export interface IContainerConfigContext {
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
}

export interface IContainerConfigGroupName extends Record<string, IContainerConfigConfigName | IOPCUALocalizedText | undefined>{
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
}

export interface IContainerConfigConfigName {
  type: EOPCUABaseDataType;
  value: string; // This depends on the specified type
  unit?: string;
  defaultValue?: string;
  mandatory?: boolean;
  sensitive? : boolean;
  name: IOPCUALocalizedText;
  description?: IOPCUALocalizedText;
  validation?: IContainerConfigValidation;
}

export interface IContainerConfigValidation {
  length?: number;
  min?: number;
  max?: number;
  pattern?: string;
  values?: string[];
}