import {
  IOPCUAData,
  IOPCUAMetaData,
  IOPCUAMasterAssetModel,
  EOPCUAMessageType,
  EBuiltInType,
  IOPCUADataMessage,
  IOPCUAMetaDataMessage,
  IOPCUAFieldMetaData,
  EOPCUALocale,
  EValueRank,
  IOPCUAConfigurationVersion,
} from '../../Models/IOPCUAPayload';

import Ajv from 'ajv'; /*tslint:disable-line*/
import NetworkMessageSchemaJson = require('../../../Config/Schemas/schemas/NetworkMessage.schema.json');
import MetaDataVersionSchemaJson = require('../../../Config/Schemas/schemas/MetaDataVersion.schema.json');
import oi4IdentifierSchemaJson = require('../../../Config/Schemas/schemas/oi4Identifier.schema.json');
import DataSetMessageSchemaJson = require('../../../Config/Schemas/schemas/DataSetMessage.schema.json');
import LocalizedTextSchemaJson = require('../../../Config/Schemas/schemas/LocalizedText.schema.json');
import resourcesSchemaJson = require('../../../Config/Schemas/schemas/resources.schema.json');

// Payloads
import healthSchemaJson = require('../../../Config/Schemas/schemas/health.schema.json');
import mamSchemaJson = require('../../../Config/Schemas/schemas/mam.schema.json');
import licenseSchemaJson = require('../../../Config/Schemas/schemas/license.schema.json');
import licenseTextSchemaJson = require('../../../Config/Schemas/schemas/licenseText.schema.json');
import profileSchemaJson = require('../../../Config/Schemas/schemas/profile.schema.json');
import eventSchemaJson = require('../../../Config/Schemas/schemas/event.schema.json');
import rtLicenseSchemaJson = require('../../../Config/Schemas/schemas/rtLicense.schema.json');
import configSchemaJson = require('../../../Config/Schemas/schemas/config.schema.json');
import publicationListSchemaJson = require('../../../Config/Schemas/schemas/publicationList.schema.json');
import subscriptionListSchemaJson = require('../../../Config/Schemas/schemas/subscriptionList.schema.json');

import uuid from 'uuid/v4'; /*tslint:disable-line*/

export interface IOPCUABuilderFieldProperties {
  [key: string]: IOPCUABuilderProps;
}

interface IOPCUABuilderProps {
  unit: string;
  description: string;
  type: EBuiltInType;
  min: number;
  max: number;
}

export class OPCUABuilder {
  oi4Id: string;
  serviceType: string;
  publisherId: string;
  jsonValidator: Ajv.Ajv;
  lastMessageId: string;

  constructor(oi4Id: string, serviceType: string) {
    this.oi4Id = oi4Id;
    this.serviceType = serviceType;
    this.publisherId = `${serviceType}/${oi4Id}`;
    this.jsonValidator = new Ajv();
    this.lastMessageId = '';

    // Add Validation Schemas
    // First common Schemas
    this.jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');
    this.jsonValidator.addSchema(MetaDataVersionSchemaJson, 'MetaDataVersion.schema.json');
    this.jsonValidator.addSchema(oi4IdentifierSchemaJson, 'oi4Identifier.schema.json');
    this.jsonValidator.addSchema(DataSetMessageSchemaJson, 'DataSetMessage.schema.json');
    this.jsonValidator.addSchema(LocalizedTextSchemaJson, 'LocalizedText.schema.json');
    this.jsonValidator.addSchema(resourcesSchemaJson, 'resources.schema.json');

    // Then payload Schemas
    this.jsonValidator.addSchema(healthSchemaJson, 'health.schema.json');
    this.jsonValidator.addSchema(mamSchemaJson, 'mam.schema.json');
    this.jsonValidator.addSchema(licenseSchemaJson, 'license.schema.json');
    this.jsonValidator.addSchema(licenseTextSchemaJson, 'licenseText.schema.json');
    this.jsonValidator.addSchema(profileSchemaJson, 'profile.schema.json');
    this.jsonValidator.addSchema(eventSchemaJson, 'event.schema.json');
    this.jsonValidator.addSchema(rtLicenseSchemaJson, 'rtLicense.schema.json');
    this.jsonValidator.addSchema(configSchemaJson, 'config.schema.json');
    this.jsonValidator.addSchema(publicationListSchemaJson, 'publicationList.schema.json');
    this.jsonValidator.addSchema(subscriptionListSchemaJson, 'subscriptionList.schema.json');
  }

  /**
   * Builds an OPCUA and OI4-conform Data Message (Including NetworkMessage)
   * @param actualPayload - the payload that is to be encapsulated inside the OPCUA Packet (key-value pair of valid data)
   * @param timestamp - the current timestamp in Date format
   * @param classId - the DataSetClassId that is used for the data (health, license etc.)
   * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
   */
  buildOPCUADataMessage(actualPayload: any, timestamp: Date, classId: string, correlationId: string = '', metaDataVersion?: IOPCUAConfigurationVersion): IOPCUAData {
    let opcUaDataPayload: IOPCUADataMessage[];
    // Not sure why empty objects were converted to an empty array. The correct behaviour is building an Empty DataSetMessage...
    // if (Object.keys(actualPayload).length === 0 && actualPayload.constructor === Object) {
    //   opcUaDataPayload = [];
    // } else {
    //   opcUaDataPayload = [this.buildOPCUAData(actualPayload, timestamp)];
    // }
    opcUaDataPayload = [this.buildOPCUAData(actualPayload, timestamp, metaDataVersion)];
    const opcUaDataMessage: IOPCUAData = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uadata,
      DataSetClassId: classId, // TODO: Generate UUID, but not here, make a lookup,
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
   * @param timestamp - the current timestamp in Date format
   * @param classId - the DataSetClassId that is used for the data (health, license etc.)
   * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
   */
  buildOPCUAMetaDataMessage(metaDataName: string, metaDataDescription: string, fieldProperties: any, timestamp: Date, classId: string, correlationId: string = ''): IOPCUAMetaData {
    const opcUaMetaDataPayload: IOPCUAMetaDataMessage = this.buildOPCUAMetaData(metaDataName, metaDataDescription, classId, fieldProperties);
    const opcUaMetaDataMessage: IOPCUAMetaData = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uametadata,
      PublisherId: this.publisherId,
      DataSetWriterId: 'somecompany.com/sensor/someid/someserial', // Currently hardcoded, originID
      MetaData: opcUaMetaDataPayload,
      CorrelationId: correlationId,
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
  private buildOPCUAData(actualPayload: any, timestamp: Date, metaDataVersion?: IOPCUAConfigurationVersion): IOPCUADataMessage {
    const opcUaDataPayload: IOPCUADataMessage = { // TODO: More elements
      DataSetWriterId: this.oi4Id,
      Timestamp: timestamp.toISOString(),
      Status: 0, // TODO switch to UASTATUSCODES
      Payload: actualPayload,
    };
    if (typeof metaDataVersion !== 'undefined' && metaDataVersion !== null) {
      opcUaDataPayload.MetaDataVersion = metaDataVersion;
    }
    return opcUaDataPayload;
  }

  // PropertyObject contains objects with name of property as key, and values: unit, description, builtInTypeype, min, max
  private buildOPCUAMetaData(metaDataName: string, metaDataDescription: string, classId: string, propertyObject: any): IOPCUAMetaDataMessage {
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
    const metaDataObject: IOPCUAMetaDataMessage = {
      name: metaDataName,
      dataSetClassId: classId,
      configurationVersion: {
        majorVersion: 0,
        minorVersion: 0,
      },
      description: {
        Locale: EOPCUALocale.enUS,
        Text: metaDataDescription,
      },
      fields: fieldArray,
    };
    return metaDataObject;
  }

  // Hardcoded dataSetFieldId
  private buildOPCUAMetaDataField(key: string, unit: string, description: string, type: EBuiltInType, min: number, max: number, valueRank: number): IOPCUAFieldMetaData {
    const field = {
      valueRank,
      name: key,
      description: {
        Locale: EOPCUALocale.enUS,
        Text: description,
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
    if (type === EBuiltInType.String) {
      field.maxStringLength = max; // If The type is a string, we interpret min/max as string-length!
    }
    if (valueRank === EValueRank.Array) {
      field.arrayDimensions = [max];
    }
    if (valueRank === EValueRank.Matrix) {
      field.arrayDimensions = [min, max];
    }
    return field;
  }

  parseOPCUAData() {

  }

  parseOPCUAMetaData() {

  }

  /**
   * A basic check used before processing any incoming payloads on the messagebus.
   * This check will not tell us where the error lies and what the error is and is just used
   * to prevent crashing. It's recommended to run the checked payload through the ConformityValidator
   * before using the asset further
   * @param payload - The payload that is to be checked
   */
  async checkOPCUAJSONValidity(payload: any): Promise<boolean> {
    let networkMessageValidationResult = false;
    try {
      networkMessageValidationResult = await this.jsonValidator.validate('NetworkMessage.schema.json', payload);
    } catch (validateErr) {
      networkMessageValidationResult = false;
    }
    return networkMessageValidationResult;
  }
}
