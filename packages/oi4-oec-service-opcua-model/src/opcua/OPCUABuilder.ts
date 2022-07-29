import {
  IOPCUANetworkMessage,
  IOPCUAMetaData,
  IOPCUADataSetMessage,
  IOPCUADataSetMetaDataType,
  IOPCUAFieldMetaData,
  IOPCUAConfigurationVersionDataType
} from '../model/IOPCUA';

import Ajv from 'ajv'; /*tslint:disable-line*/

import {topicPathSchemaJson} from '@oi4/oi4-oec-json-schemas';

import { buildOpcUaJsonValidator } from './OpcUaSchemaProvider';

import { v4 as uuid } from 'uuid'; /*tslint:disable-line*/
import {EOPCUABuiltInType, EOPCUALocale, EOPCUAMessageType, EOPCUAStatusCode, EOPCUAValueRank} from '../model/EOPCUA';
import {ServiceTypes} from '../model/ServiceTypes';
import {Oi4Identifier} from "../model/Oi4Identifier";

export class OPCUABuilder {
  oi4Id: Oi4Identifier;
  serviceType: ServiceTypes;
  publisherId: string;
  jsonValidator: Ajv.Ajv;
  lastMessageId: string;
  private topicRex: RegExp;
  private readonly msgSizeOffset: number;

  constructor(oi4Id: Oi4Identifier, serviceTypes: ServiceTypes, uaJsonValidator = buildOpcUaJsonValidator()) {
    this.oi4Id = oi4Id;
    this.serviceType = serviceTypes;
    this.publisherId = `${serviceTypes}/${oi4Id}`;
    this.jsonValidator = uaJsonValidator;
    this.lastMessageId = '';
    this.msgSizeOffset = 1000;

    this.topicRex = new RegExp(topicPathSchemaJson.pattern);
  }


  buildPaginatedOPCUANetworkMessageArray(dataSetPayloads: IOPCUADataSetMessage[], timestamp: Date, dataSetClassId: string, correlationId = '', page = 0, perPage = 0, filter?: string, metadataVersion?: IOPCUAConfigurationVersionDataType): IOPCUANetworkMessage[] {
    const networkMessageArray: IOPCUANetworkMessage[] = [];
    networkMessageArray.push(this.buildOPCUANetworkMessage([dataSetPayloads[0]], timestamp, dataSetClassId, correlationId, filter, metadataVersion));
    let currentNetworkMessageIndex = 0;
    for (const [payloadIndex, remainingPayloads] of dataSetPayloads.slice(1).entries()) {
      const wholeMsgLengthBytes = Buffer.byteLength(JSON.stringify(networkMessageArray[currentNetworkMessageIndex]));
      if (wholeMsgLengthBytes + this.msgSizeOffset < parseInt(process.env.OI4_EDGE_MQTT_MAX_MESSAGE_SIZE!, 10) && (perPage === 0 || (perPage !== 0 && networkMessageArray[currentNetworkMessageIndex].Messages.length < perPage))) {
        networkMessageArray[currentNetworkMessageIndex].Messages.push(this.buildOPCUADataSetMessage(remainingPayloads.Payload, timestamp, remainingPayloads.DataSetWriterId, remainingPayloads.subResource, remainingPayloads.Status, filter, metadataVersion));
      } else {
        // This is the paginationObject
        networkMessageArray[currentNetworkMessageIndex].Messages.push(this.buildOPCUADataSetMessage(
          {
            totalCount: dataSetPayloads.length,
            perPage: networkMessageArray[currentNetworkMessageIndex].Messages.length,
            page: currentNetworkMessageIndex + 1,
            hasNext: true,
          }, timestamp, parseInt(`${remainingPayloads.DataSetWriterId}${currentNetworkMessageIndex}`, 10)
        ));
        if (page !== 0 && currentNetworkMessageIndex >= page) {
          if (payloadIndex === dataSetPayloads.length) {
            networkMessageArray[currentNetworkMessageIndex].Messages.slice(-1)[0].Payload.hasNext = false;
          }
          break; // If we request a certain page, there's no need to build more than necessary
        }
        networkMessageArray.push(this.buildOPCUANetworkMessage([remainingPayloads], timestamp, dataSetClassId, correlationId, filter, metadataVersion));
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
  buildOPCUANetworkMessage(dataSetPayloads: IOPCUADataSetMessage[], timestamp: Date, dataSetClassId: string, correlationId = '', filter?: string, metaDataVersion?: IOPCUAConfigurationVersionDataType): IOPCUANetworkMessage {
    const opcUaDataPayload: IOPCUADataSetMessage[] = [];
    // Not sure why empty objects were converted to an empty array. The correct behaviour is building an Empty DataSetMessage...
    // if (Object.keys(actualPayload).length === 0 && actualPayload.constructor === Object) {
    //   opcUaDataPayload = [];
    // } else {
    //   opcUaDataPayload = [this.buildOPCUAData(actualPayload, timestamp)];
    // }
    for (const payloads of dataSetPayloads) {
      opcUaDataPayload.push(this.buildOPCUADataSetMessage(payloads.Payload, timestamp, payloads.DataSetWriterId, payloads.subResource, payloads.Status, filter, metaDataVersion));
    }
    const opcUaDataMessage: IOPCUANetworkMessage = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uaData,
      DataSetClassId: dataSetClassId, // TODO: Generate UUID, but not here, make a lookup,
      PublisherId: this.publisherId,
      Messages: opcUaDataPayload,
      correlationId: correlationId,
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
   * @param dataSetWriterId - An identifier for DataSetWriter which published the DataSetMetaData. It is unique within the scope of a Publisher. The related DataSetMessage (9.2.3) to this DataSetMetaData contains the same DataSetWriterId.
   * @param filter - The filter is mandatory, but does not belong to OPC UA DataSetMetaData according to Part 14-7.2.3.4.2-Table 93. In combination with the used resource in the topic, the filter, together with the subResource, contains the readable reference to the DataSetWriterId and is identical to the filter in the topic (8.1.7).
   * @param subResource - The subResource is mandatory, but does not belong to OPC UA DataSetMessage according to Part 14-7.2.3.3-Table 92. In combination with the used resource in the topic, the subResource, together with the filter, contains the readable reference to the DataSetWriterId and is identical to the subResource in the topic (8.1.6) if present.
   * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
   */
  buildOPCUAMetaDataMessage(metaDataName: string, metaDataDescription: string, fieldProperties: any, classId: string, dataSetWriterId: number, filter: string, subResource: string, correlationId = ''): IOPCUAMetaData {
    const opcUaMetaDataPayload: IOPCUADataSetMetaDataType = this.buildOPCUAMetaData(metaDataName, metaDataDescription, classId, fieldProperties);
    const opcUaMetaDataMessage: IOPCUAMetaData = {
      MessageId: `${Date.now().toString()}-${this.publisherId}`,
      MessageType: EOPCUAMessageType.uaMetadata,
      PublisherId: this.publisherId,
      DataSetWriterId: dataSetWriterId,
      filter: filter,
      subResource: subResource,
      correlationId: correlationId,
      MetaData: opcUaMetaDataPayload,
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
  private buildOPCUADataSetMessage(actualPayload: any, timestamp: Date, dataSetWriterId: number, subResource: string = this.oi4Id.toString(), status: EOPCUAStatusCode = EOPCUAStatusCode.Good, filter?: string, metaDataVersion?: IOPCUAConfigurationVersionDataType): IOPCUADataSetMessage {
    const opcUaDataPayload: IOPCUADataSetMessage = { // TODO: More elements
      DataSetWriterId: dataSetWriterId,
      Timestamp: timestamp.toISOString(),
      filter: filter,
      subResource: subResource,
      Payload: actualPayload,
    };
    if (typeof metaDataVersion !== 'undefined' && metaDataVersion !== null) {
      opcUaDataPayload.MetaDataVersion = metaDataVersion;
    }
    if (status !== EOPCUAStatusCode.Good) {
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
    try {
      return await this.jsonValidator.validate('NetworkMessage.schema.json', payload);
    } catch (validateErr) {
      throw `Validation failed with: ${validateErr.message}`
    }
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
