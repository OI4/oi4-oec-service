export type IOPCUAData = IOPCUANetworkMessage;
export type IOPCUAMetaData = IOPCUADataSetMetaData;
export type IOPCUAMasterAssetModel = IOPCUANetworkMessage;

export interface IOPCUAPayload {
  [key:string]: any;
}

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

interface IOPCUANetworkMessage {
  MessageId: string; // TODO: Not yet defined
  MessageType: EOPCUAMessageType;
  DataSetClassId: GUID; // TODO: STRING for now, validators found below (thanks to node-opcua)
  Messages: IOPCUADataSetMessage[]; // TODO: This should be generic (either Messages or MetaData)
  PublisherId: string; // TODO: string in the OI4-format, need to add validators
  CorrelationId: string;
}

// Data Message containing the values
export interface IOPCUADataSetMessage {
  DataSetWriterId: number; // oi4ID
  SequenceNumber?: number;
  MetaDataVersion?: IOPCUAConfigurationVersionDataType;
  Timestamp?: string; // TODO: Date type?
  Status?: number;
  POI?: string;
  Payload: any; // TODO: arbitrary object?
}

interface IOPCUADataSetMetaData {
  MessageId: string; // TODO: Not yet defined
  MessageType: EOPCUAMessageType;
  PublisherId: string; // OI4-id!
  DataSetWriterId: number;
  CorrelationId: string;
  MetaData: IOPCUADataSetMetaDataType; // TODO: This should be generic (MetaData)
  POI: string;
}

// MetaData Message containing information about units etc.
export interface IOPCUADataSetMetaDataType {
  name: string; // name of DataSet
  description: IOPCUALocalizedText;
  fields: IOPCUAFieldMetaData[];
  dataSetClassId: GUID;
  configurationVersion: IOPCUAConfigurationVersionDataType;
}

export interface IOPCUAFieldMetaData {
  name: string;
  description: IOPCUALocalizedText;
  fieldFlags: number;
  builtInType: number;
  dataType: IOPCUADataType;
  valueRank: number;
  arrayDimensions: any[];
  maxStringLength: number;
  dataSetFieldId: GUID;
  properties: IOPCUAKeyValuePair[];
}

interface IOPCUAKeyValuePair {
  key: IOPCUAKey;
  value: any;
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
  locale: EOPCUALocale;
  text: string;
}

export interface IOPCUAConfigurationVersionDataType{
  majorVersion: number;
  minorVersion: number;
}

export interface IOPCUAPayload {
  poi?: string;
  payload: any;
}

export enum EOPCUALocale {
  enUS = 'en-US',
}

export enum EOPCUAMessageType {
  uadata = 'ua-data',
  uametadata = 'ua-metadata',
}

export enum EOPCUABuiltInType {
  Boolean = 1,
  SByte = 2,
  Byte = 3,
  Int16 = 4,
  UInt16 = 5,
  Int32 = 6,
  UInt32 = 7,
  Int64 = 8,
  UIn64 = 9,
  Float = 10,
  Double = 11,
  String = 12,
  DateTime = 13,
  Guid = 14,
  ByteString = 15,
  XmlElement = 16,
  NodeId = 17,
  ExpandedNodeId = 18,
  StatusCode = 19,
  QualifiedName = 20,
  LocalizedText = 21,
  ExtensionObject = 22,
  DataValue = 23,
  Variant = 24,
  DiagnosticInfo = 25,
}

export enum EOPCUABaseDataType { // TODO: Needs to be expanded
  Boolean = 'Boolean',
  ByteString = 'ByteString',
  DateTime = 'DateTime',
  Number = 'Number',
  String = 'String',
}

export enum EOPCUAValueRank {
  Any = -2,
  Scalar = -1,
  ArrayAny = 0,
  Array = 1,
  Matrix = 2,
}

type GUID = string;

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
