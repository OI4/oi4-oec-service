import { EOPCUALocale, EOPCUAMessageType, EOPCUAStatusCode } from './EOPCUA';
import {Oi4Identifier} from '../../model/Oi4Identifier';

export type IOPCUAMetaData = IOPCUADataSetMetaData;

export interface IMasterAssetModel {
  Manufacturer: IOPCUALocalizedText;
  ManufacturerUri: string;
  Model: IOPCUALocalizedText;
  ProductCode: string;
  HardwareRevision: string;
  SoftwareRevision: string;
  DeviceRevision: string;
  DeviceManual: string;
  DeviceClass: string; // TODO: EClasses??
  SerialNumber: string;
  ProductInstanceUri: string;
  RevisionCounter: number;
  Description: IOPCUALocalizedText;
}

export interface IOPCUANetworkMessage {
  MessageId: MessageId;
  MessageType: EOPCUAMessageType;
  PublisherId: string; // TODO: string in the format <serviceType>/<appId>, need to add validators
  DataSetClassId: GUID;
  CorrelationId?: MessageId;
  Messages: IOPCUADataSetMessage[]; // TODO: This should be generic (either Messages or MetaData)
}

// Data Message containing the values
export interface IOPCUADataSetMessage {
  DataSetWriterId: number; // oi4ID
  SequenceNumber?: number;
  MetaDataVersion?: IOPCUAConfigurationVersionDataType;
  Timestamp?: string; // TODO: Date type?
  Status?: EOPCUAStatusCode; //Optional and shall not be shown, when Status = 0 => OK
  Filter?: string;
  Source: Oi4Identifier;
  Payload: any; // TODO: arbitrary object?
}

export interface IOPCUADataSetMetaData {
  MessageId: string; // TODO: Not yet defined <unixTimestampInMs-PublisherId>
  MessageType: EOPCUAMessageType;
  PublisherId: string; // OI4-id!
  DataSetWriterId: number;
  Filter: string;
  Source: Oi4Identifier;
  CorrelationId: string;
  MetaData: IOPCUADataSetMetaDataType; // TODO: This should be generic (MetaData)
}

// MetaData Message containing information about units etc.
export interface IOPCUADataSetMetaDataType {
  Name: string; // name of DataSet
  Description: IOPCUALocalizedText;
  Fields: IOPCUAFieldMetaData[];
  DataSetClassId: GUID;
  ConfigurationVersion: IOPCUAConfigurationVersionDataType;
}

export interface IOPCUAFieldMetaData {
  Name: string;
  Description: IOPCUALocalizedText;
  FieldFlags: number;
  BuiltInType: number;
  DataType: IOPCUADataType;
  ValueRank: number;
  ArrayDimensions: any[];
  MaxStringLength: number;
  DataSetFieldId: GUID;
  Properties: IOPCUAKeyValuePair[];
}

interface IOPCUAKeyValuePair {
  Key: IOPCUAKey;
  Value: any;
}

interface IOPCUAKey {
  Name: string;
  Uri: number;
}

interface IOPCUADataType {
  IdType: number;
  Id: number;
}

export interface IOPCUALocalizedText {
  Locale: EOPCUALocale;
  Text: string;
}

export interface IOPCUAConfigurationVersionDataType{
  MajorVersion: number;
  MinorVersion: number;
}

// TODO: STRING for now, validators found below (thanks to node-opcua)
type GUID = string;

// TODO: string in the format <unixTimestampInMs-PublisherId>, need to add validators
type MessageId = string;
// /***
//  * @module node-opcua-guid
//  */
// const regexGUID = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;

// /**
//  * checks if provided string is a valid Guid
//  * a valid GUID has the form  XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX
//  * when X is a hexadecimal digit
//  *
//  * @method isValidGuid
//  * @param guid - the GUID to test for validaty
//  * @return  - true if the string is a valid GUID.
//  */
// export function isValidGuid(guid: string): boolean {
//     return regexGUID.test(guid);
// }

// //                             1         2         3
// //                   012345678901234567890123456789012345
// export const emptyGuid = "00000000-0000-0000-0000-000000000000";

// export type Guid = string;
