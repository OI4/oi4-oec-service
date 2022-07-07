import { SubscriptionListConfig } from './Resource';
import { EOPCUABaseDataType } from '@oi4/oi4-oec-service-opcua-model';
import { IOPCUALocalizedText } from '@oi4/oi4-oec-service-opcua-model';

// Common Container config interfaces
export interface IContainerConfig extends Record<string, IContainerConfigGroupName | IContainerConfigContext> {
  context: IContainerConfigContext;
}

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

export interface ISubscriptionListObject {
  topicPath: string;
  interval?: number;
  config?: SubscriptionListConfig;
}

// export interface IPublicationListObject {
//   resource: string;
//   tag?: string;
//   DataSetWriterId: number; // Actually OI4-Identifier: TODO: Validator
//   oi4Identifier: string;
//   active?: boolean;
//   explicit?: EPublicationListExplicit;
//   interval?: number; // UINT32
//   precisions?: number; // REAL
//   config?: EPublicationListConfig;
// }
