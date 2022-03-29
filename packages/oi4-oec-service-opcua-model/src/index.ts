import {
  IOPCUANetworkMessage,
  IOPCUAMetaData,
  IOPCUADataSetMessage,
  IOPCUADataSetMetaDataType,
  IOPCUAFieldMetaData,
  IOPCUAConfigurationVersionDataType,
  IOPCUAPayload,
} from './model/IOPCUA';

import Ajv from 'ajv'; /*tslint:disable-line*/

// Base
import oi4IdentifierSchemaJson from '@oi4/json-schemas/schemas/oi4Identifier.schema.json';
// Constants
import resourcesSchemaJson from '@oi4/json-schemas/schemas/constants/resources.schema.json';
import topicPathSchemaJson from '@oi4/json-schemas/schemas/constants/topicPath.schema.json';
// Payloads
import healthSchemaJson from '@oi4/json-schemas/schemas/health.schema.json';
import mamSchemaJson from '@oi4/json-schemas/schemas/mam.schema.json';
import licenseSchemaJson from '@oi4/json-schemas/schemas/license.schema.json';
import licenseTextSchemaJson from '@oi4/json-schemas/schemas/licenseText.schema.json';
import profileSchemaJson from '@oi4/json-schemas/schemas/profile.schema.json';
import eventSchemaJson from '@oi4/json-schemas/schemas/event.schema.json';
import rtLicenseSchemaJson from '@oi4/json-schemas/schemas/rtLicense.schema.json';
import configSchemaJson from '@oi4/json-schemas/schemas/config.schema.json';
import publicationListSchemaJson from '@oi4/json-schemas/schemas/publicationList.schema.json';
import subscriptionListSchemaJson from '@oi4/json-schemas/schemas/subscriptionList.schema.json';
import referenceDesignationSchemaJson from '@oi4/json-schemas/schemas/referenceDesignation.schema.json';
import localeSchemaJson from '@oi4/json-schemas/schemas/locale.schema.json';
import paginationSchemaJson from '@oi4/json-schemas/schemas/pagination.schema.json';

import {
  // Base
  NetworkMessageSchemaJson,
  ConfigurationVersionDataTypeSchemaJson,
  DataSetMessageSchemaJson,
  // Constants
  LocalizedTextSchemaJson,
  localePatternSchemaJson,
  //DataTypes
  byteSchemaJson,
  int8SchemaJson,
  int16SchemaJson,
  int32SchemaJson,
  uint16SchemaJson,
  uint32SchemaJson,
} from './OpcUaSchemaProvider';

import { v4 as uuid } from 'uuid'; /*tslint:disable-line*/
import { EOPCUABuiltInType, EOPCUALocale, EOPCUAMessageType, EOPCUAValueRank } from './model/EOPCUA';

export * from "./OpcUaSchemaProvider";
export * from "./model/EOPCUA";
export * from "./model/IOPCUA";

export interface IOPCUABuilderFieldProperties {
  [key: string]: IOPCUABuilderProps;
}

interface IOPCUABuilderProps {
  unit: string;
  description: string;
  type: EOPCUABuiltInType;
  min: number;
  max: number;
}

export class OPCUABuilder {
  oi4Id: string;
  serviceType: string;
  publisherId: string;
  jsonValidator: Ajv.Ajv;
  lastMessageId: string;
  private topicRex: RegExp;
  private msgSizeOffset: number;

  constructor(oi4Id: string, serviceType: string) {
    this.oi4Id = oi4Id;
    this.serviceType = serviceType;
    this.publisherId = `${serviceType}/${oi4Id}`;
    this.jsonValidator = new Ajv();
    this.lastMessageId = '';
    this.msgSizeOffset = 1000;

    this.topicRex = new RegExp(topicPathSchemaJson.pattern);

    // Add Validation Schemas
    // First common Schemas
    this.jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');
    this.jsonValidator.addSchema(ConfigurationVersionDataTypeSchemaJson, 'ConfigurationVersionDataType.schema.json');
    this.jsonValidator.addSchema(oi4IdentifierSchemaJson, 'oi4Identifier.schema.json');
    this.jsonValidator.addSchema(DataSetMessageSchemaJson, 'DataSetMessage.schema.json');

    // Then constants
    this.jsonValidator.addSchema(LocalizedTextSchemaJson, 'LocalizedText.schema.json');
    this.jsonValidator.addSchema(resourcesSchemaJson, 'resources.schema.json');
    this.jsonValidator.addSchema(topicPathSchemaJson, 'topicPath.schema.json');
    this.jsonValidator.addSchema(localePatternSchemaJson, 'locale.pattern.schema.json');


    // Then dataTypes
    this.jsonValidator.addSchema(byteSchemaJson, 'byte.schema.json');
    this.jsonValidator.addSchema(int8SchemaJson, 'int8.schema.json');
    this.jsonValidator.addSchema(int16SchemaJson, 'int16.schema.json');
    this.jsonValidator.addSchema(int32SchemaJson, 'int32.schema.json');
    this.jsonValidator.addSchema(uint16SchemaJson, 'uint16.schema.json');
    this.jsonValidator.addSchema(uint32SchemaJson, 'uint32.schema.json');

    // Then payload Schemas
    this.jsonValidator.addSchema(healthSchemaJson, 'health.schema.json');
    this.jsonValidator.addSchema(mamSchemaJson, 'mam.schema.json');
    this.jsonValidator.addSchema(licenseSchemaJson, 'license.schema.json');
    this.jsonValidator.addSchema(licenseTextSchemaJson, 'licenseText.schema.json');
    this.jsonValidator.addSchema(profileSchemaJson, 'profile.schema.json');
    this.jsonValidator.addSchema(eventSchemaJson, 'event.schema.json');
    this.jsonValidator.addSchema(rtLicenseSchemaJson, 'rtLicense.schema.json');
    this.jsonValidator.addSchema(configSchemaJson, 'configPublish.schema.json');
    this.jsonValidator.addSchema(publicationListSchemaJson, 'publicationList.schema.json');
    this.jsonValidator.addSchema(subscriptionListSchemaJson, 'subscriptionList.schema.json');
    this.jsonValidator.addSchema(referenceDesignationSchemaJson, 'referenceDesignation.schema.json')
    this.jsonValidator.addSchema(localeSchemaJson, 'locale.schema.json');
    this.jsonValidator.addSchema(paginationSchemaJson, 'pagination.schema.json');
  }


  buildPaginatedOPCUANetworkMessageArray(dataSetPayloads: IOPCUAPayload[], timestamp: Date, dataSetClassId: string, correlationId: string = '', page: number = 0, perPage: number = 0, metadataVersion?: IOPCUAConfigurationVersionDataType): IOPCUANetworkMessage[] {
    const networkMessageArray: IOPCUANetworkMessage[] = [];
    networkMessageArray.push(this.buildOPCUANetworkMessage([dataSetPayloads[0]], timestamp, dataSetClassId, correlationId, metadataVersion));
    let currentNetworkMessageIndex = 0;
    for (const [payloadIndex, remainingPayloads] of dataSetPayloads.slice(1).entries()) {
      const wholeMsgLengthBytes = Buffer.byteLength(JSON.stringify(networkMessageArray[currentNetworkMessageIndex]));
      if (wholeMsgLengthBytes + this.msgSizeOffset < parseInt(process.env.OI4_EDGE_MQTT_MAX_MESSAGE_SIZE!, 10) && (perPage === 0 || (perPage !== 0 && networkMessageArray[currentNetworkMessageIndex].Messages.length < perPage))) {
        networkMessageArray[currentNetworkMessageIndex].Messages.push(this.buildOPCUADataSetMessage(remainingPayloads.payload, timestamp, remainingPayloads.dswid, remainingPayloads.poi, remainingPayloads.status, metadataVersion));
      } else {
        // This is the paginationObject
        networkMessageArray[currentNetworkMessageIndex].Messages.push(this.buildOPCUADataSetMessage(
          {
            totalCount: dataSetPayloads.length,
            perPage: networkMessageArray[currentNetworkMessageIndex].Messages.length,
            page: currentNetworkMessageIndex + 1,
            hasNext: true,
          }, timestamp, parseInt(`${remainingPayloads.dswid}${currentNetworkMessageIndex}`, 10)
        ));
        if (page !== 0 && currentNetworkMessageIndex >= page) {
          if (payloadIndex === dataSetPayloads.length) {
            networkMessageArray[currentNetworkMessageIndex].Messages.slice(-1)[0].Payload.hasNext = false;
          }
          break; // If we request a certain page, there's no need to build more than necessary
        }
        networkMessageArray.push(this.buildOPCUANetworkMessage([remainingPayloads], timestamp, dataSetClassId, correlationId, metadataVersion));
        currentNetworkMessageIndex++;
      }
    }
    if (page === 0 || (page !== 0 && currentNetworkMessageIndex < page)) {
      // Pagination Object
      networkMessageArray[currentNetworkMessageIndex].Messages.push(this.buildOPCUADataSetMessage(
        {
          totalCount: dataSetPayloads.length,
          perPage: networkMessageArray[currentNetworkMessageIndex].Messages.length,
          page: currentNetworkMessageIndex + 1,
          hasNext: false,
        },
        timestamp,
        parseInt(`${networkMessageArray[currentNetworkMessageIndex].Messages.slice(-1)[0].DataSetWriterId}${currentNetworkMessageIndex}`, 10)
      ));
    }
    // If a specific page was requested, wo only send that page
    if ((page !== 0 && page > 0)) {
      if (page > networkMessageArray.length) return [];
      // Since the request was for one specific page, we always set hasNext to false here
      const returnedPage = networkMessageArray[page-1];
      returnedPage.Messages[returnedPage.Messages.length - 1].Payload.hasNext = false;
      return [returnedPage];
    } else {
      return networkMessageArray;
    }
  }

  /**
   * Builds an OPCUA and OI4-conform Data Message (Including NetworkMessage)
   * @param actualPayload - the payload that is to be encapsulated inside the OPCUA Packet (key-value pair of valid data)
   * @param timestamp - the current timestamp in Date format
   * @param classId - the DataSetClassId that is used for the data (health, license etc.)
   * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
   */
  buildOPCUANetworkMessage(dataSetPayloads: IOPCUAPayload[], timestamp: Date, dataSetClassId: string, correlationId: string = '', metaDataVersion?: IOPCUAConfigurationVersionDataType): IOPCUANetworkMessage {
    let opcUaDataPayload: IOPCUADataSetMessage[] = [];
    // Not sure why empty objects were converted to an empty array. The correct behaviour is building an Empty DataSetMessage...
    // if (Object.keys(actualPayload).length === 0 && actualPayload.constructor === Object) {
    //   opcUaDataPayload = [];
    // } else {
    //   opcUaDataPayload = [this.buildOPCUAData(actualPayload, timestamp)];
    // }
    for (const payloads of dataSetPayloads) {
      opcUaDataPayload.push(this.buildOPCUADataSetMessage(payloads.payload, timestamp, payloads.dswid, payloads.poi, payloads.status, metaDataVersion));
    }
    const opcUaDataMessage: IOPCUANetworkMessage = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uadata,
      DataSetClassId: dataSetClassId, // TODO: Generate UUID, but not here, make a lookup,
      PublisherId: this.publisherId,
      Messages: opcUaDataPayload,
      CorrelationId: correlationId,
    };
    if (this.lastMessageId === opcUaDataMessage.MessageId) {
      opcUaDataMessage.MessageId = `OverFlow${opcUaDataMessage.MessageId}`;
    } else {
      this.lastMessageId = opcUaDataMessage.MessageId;
    }
    return opcUaDataMessage;
  }

  /**
   * Builds an OPCUA and OI4-conform MetaData Message (Including NetworkMessage)
   * @param metaDataName - the name of the dataset the metadata corresponds to
   * @param metaDataDescription - the description that is to be encapsulated in the metadata message
   * @param fieldProperties - the properties of each field. Currently consists of unit, description, type, min/max and valueRank. TODO: this is not finalized yet
   * @param classId - the DataSetClassId that is used for the data (health, license etc.)
   * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
   */
  buildOPCUAMetaDataMessage(metaDataName: string, metaDataDescription: string, fieldProperties: any, classId: string, correlationId: string = ''): IOPCUAMetaData {
    const opcUaMetaDataPayload: IOPCUADataSetMetaDataType = this.buildOPCUAMetaData(metaDataName, metaDataDescription, classId, fieldProperties);
    const opcUaMetaDataMessage: IOPCUAMetaData = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uametadata,
      PublisherId: this.publisherId,
      POI: 'somecompany.com/sensor/someid/someserial', // Currently hardcoded, originID
      MetaData: opcUaMetaDataPayload,
      CorrelationId: correlationId,
      DataSetWriterId: 0, // Hardcoded
    };
    if (this.lastMessageId === opcUaMetaDataMessage.MessageId) {
      opcUaMetaDataMessage.MessageId = `OverFlow${opcUaMetaDataMessage.MessageId}`;
    } else {
      this.lastMessageId = opcUaMetaDataMessage.MessageId;
    }
    return opcUaMetaDataMessage;
  }

  /**
   * Encapsulates Payload inside "Messages" Object of OPCUAData
   * @param actualPayload - the payload (valid key-values) that is to be encapsulated
   * @param timestamp - the current timestamp in Date format
   */
  private buildOPCUADataSetMessage(actualPayload: any, timestamp: Date, dswid: number, poi: string = this.oi4Id, status: number = 0, metaDataVersion?: IOPCUAConfigurationVersionDataType): IOPCUADataSetMessage {
    const opcUaDataPayload: IOPCUADataSetMessage = { // TODO: More elements
      DataSetWriterId: dswid,
      Timestamp: timestamp.toISOString(),
      POI: poi,
      Payload: actualPayload,
    };
    if (typeof metaDataVersion !== 'undefined' && metaDataVersion !== null) {
      opcUaDataPayload.MetaDataVersion = metaDataVersion;
    }
    if (status !== 0) {
      opcUaDataPayload.Status = status;
    }
    return opcUaDataPayload;
  }

  // PropertyObject contains objects with name of property as key, and values: unit, description, builtInTypeype, min, max
  private buildOPCUAMetaData(metaDataName: string, metaDataDescription: string, classId: string, propertyObject: any): IOPCUADataSetMetaDataType {
    const fieldArray: IOPCUAFieldMetaData[] = [];
    let fieldObject: IOPCUAFieldMetaData;
    for (const items of Object.keys(propertyObject)) {
      fieldObject = this.buildOPCUAMetaDataField(
        items,
        propertyObject[items].unit,
        propertyObject[items].description,
        propertyObject[items].type,
        propertyObject[items].min,
        propertyObject[items].max,
        propertyObject[items].valueRank,
      );
      fieldArray.push(fieldObject);
    }
    const metaDataObject: IOPCUADataSetMetaDataType = {
      name: metaDataName,
      dataSetClassId: classId,
      configurationVersion: {
        majorVersion: 0,
        minorVersion: 0,
      },
      description: {
        locale: EOPCUALocale.enUS,
        text: metaDataDescription,
      },
      fields: fieldArray,
    };
    return metaDataObject;
  }

  // Hardcoded dataSetFieldId
  private buildOPCUAMetaDataField(key: string, unit: string, description: string, type: EOPCUABuiltInType, min: number, max: number, valueRank: number): IOPCUAFieldMetaData {
    const field = {
      valueRank,
      name: key,
      description: {
        locale: EOPCUALocale.enUS,
        text: description,
      },
      fieldFlags: 0, // Currently not parsed
      builtInType: type,
      dataType: { // Currently not parsed, should be the NodeID of builtInType
        IdType: 0,
        Id: 1,
      },
      arrayDimensions: [0], // Initial value, set later
      maxStringLength: 0, // Initial value, set later
      dataSetFieldId: uuid(), // TODO: Discuss which uuid needs to be here
      properties: [ // Partially hardcoded!
        {
          key: {
            Name: 'Unit',
            Uri: 0,
          },
          value: unit,
        },
        {
          key: {
            Name: 'Min',
            Uri: 0,
          },
          value: min,
        },
        {
          key: {
            Name: 'Max',
            Uri: 0,
          },
          value: max,
        },
      ],
    };
    if (type === EOPCUABuiltInType.String) {
      field.maxStringLength = max; // If The type is a string, we interpret min/max as string-length!
    }
    if (valueRank === EOPCUAValueRank.Array) {
      field.arrayDimensions = [max];
    }
    if (valueRank === EOPCUAValueRank.Matrix) {
      field.arrayDimensions = [min, max];
    }
    return field;
  }

  parseOPCUAData() {

  }

  parseOPCUAMetaData() {

  }

  checkTopicPath(topicPath: string): boolean {
    return this.topicRex.test(topicPath);
  }

  /**
   * A basic check used before processing any incoming payloads on the messagebus.
   * This check will not tell us where the error lies and what the error is and is just used
   * to prevent crashing. It's recommended to run the checked payload through the ConformityValidator
   * before using the asset further
   * @param payload - The payload that is to be checked
   */
  async checkOPCUAJSONValidity(payload: any): Promise<boolean> {
    let networkMessageValidationResult: boolean;
    try {
      networkMessageValidationResult = await this.jsonValidator.validate('NetworkMessage.schema.json', payload);
    } catch (validateErr) {
      networkMessageValidationResult = false;
    }
    if (networkMessageValidationResult === false) {
      const errJSON = this.jsonValidator.errors;
      throw JSON.stringify(errJSON);
    }
    return networkMessageValidationResult;
  }

  async checkPayloadType(payload: any): Promise<string> {
    let payloadMessageValidation = false;
    try {
      payloadMessageValidation = await this.jsonValidator.validate('pagination.schema.json', payload);
    } catch (validateErr) {
      payloadMessageValidation = false;
    }
    if (payloadMessageValidation === true) {
      return 'pagination';
    }
    try {
      payloadMessageValidation = await this.jsonValidator.validate('locale.schema.json', payload);
    } catch (validateErr) {
      payloadMessageValidation = false;
    }
    if (payloadMessageValidation === true) {
      return 'locale';
    }
    return 'none';
  }
}
