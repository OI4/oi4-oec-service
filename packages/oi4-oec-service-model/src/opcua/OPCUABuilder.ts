import {
    IOPCUAConfigurationVersionDataType,
    IOPCUADataSetMessage,
    IOPCUADataSetMetaDataType,
    IOPCUAFieldMetaData,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from './model/IOPCUA';

import Ajv from 'ajv'; /*tslint:disable-line*/
import {topicPathSchemaJson} from '@oi4/oi4-oec-json-schemas';

import {buildOpcUaJsonValidator} from './OpcUaSchemaProvider';

import {v4 as uuid} from 'uuid'; /*tslint:disable-line*/
import {EOPCUABuiltInType, EOPCUALocale, EOPCUAMessageType, EOPCUAStatusCode, EOPCUAValueRank} from './model/EOPCUA';
import {ServiceTypes} from '../model/ServiceTypes';
import {Oi4Identifier} from '../model/Oi4Identifier';

export class OPCUABuilder {
    oi4Id: Oi4Identifier;
    serviceType: ServiceTypes;
    publisherId: string;
    jsonValidator: Ajv.Ajv;
    lastMessageId: string;
    private topicRex: RegExp;
    private readonly msgSizeOffset: number;
    private readonly _maxMessageSize: number;

    constructor(oi4Id: Oi4Identifier, serviceTypes: ServiceTypes, maxMessageSize = 262144, uaJsonValidator = buildOpcUaJsonValidator()) {
        this.oi4Id = oi4Id;
        this.serviceType = serviceTypes;
        this.publisherId = `${serviceTypes}/${oi4Id}`;
        this.jsonValidator = uaJsonValidator;
        this.lastMessageId = '';
        this.msgSizeOffset = 1000;
        this._maxMessageSize = maxMessageSize;

        this.topicRex = new RegExp(topicPathSchemaJson.pattern);
    }

    private getUniqueMessageId(messageId: string): string {
        for (let counter = 0; this.lastMessageId === messageId; counter++) {
            messageId = `${counter}${messageId}`;
        }
        return messageId;
    }

    buildPaginatedOPCUANetworkMessageArray(dataSetPayloads: IOPCUADataSetMessage[], timestamp: Date, dataSetClassId: string, correlationId = '', page = 0, perPage = 0): IOPCUANetworkMessage[] {
        const networkMessageArray: IOPCUANetworkMessage[] = [];
        networkMessageArray.push(this.buildOPCUANetworkMessage([dataSetPayloads[0]], timestamp, dataSetClassId, correlationId));
        let currentNetworkMessageIndex = 0;
        let firstMessageId: string;
        for (const [payloadIndex, remainingPayloads] of dataSetPayloads.slice(1).entries()) {
            const currentMessage = networkMessageArray[currentNetworkMessageIndex];
            if(firstMessageId === undefined){
                firstMessageId = currentMessage.MessageId;
            }
            const wholeMsgLengthBytes = Buffer.byteLength(JSON.stringify(currentMessage));
            if (wholeMsgLengthBytes + this.msgSizeOffset < this._maxMessageSize && (perPage === 0 || (perPage !== 0 && currentMessage.Messages.length < perPage))) {
                currentMessage.Messages.push(this.buildOPCUADataSetMessage(remainingPayloads.Payload, timestamp, remainingPayloads.DataSetWriterId, remainingPayloads.Source, remainingPayloads.Status, remainingPayloads.Filter, remainingPayloads.MetaDataVersion));
            } else {
                // This is the paginationObject
                currentMessage.Messages.push(this.buildOPCUADataSetMessage(
                    {
                        TotalCount: dataSetPayloads.length,
                        PerPage: currentMessage.Messages.length,
                        Page: currentNetworkMessageIndex + 1,
                        HasNext: true,
                        PaginationId: firstMessageId,
                    }, timestamp, parseInt(`${remainingPayloads.DataSetWriterId}${currentNetworkMessageIndex}`, 10)
                ));
                firstMessageId = undefined;
                if (page !== 0 && currentNetworkMessageIndex >= page) {
                    if (payloadIndex === dataSetPayloads.length) {
                        currentMessage.Messages.slice(-1)[0].Payload.HasNext = false;
                    }
                    break; // If we request a certain Page, there's no need to build more than necessary
                }
                networkMessageArray.push(this.buildOPCUANetworkMessage([remainingPayloads], timestamp, dataSetClassId, correlationId));
                currentNetworkMessageIndex++;
            }
        }
        if (page === 0 || (page !== 0 && currentNetworkMessageIndex < page)) {
            const currentMessage = networkMessageArray[currentNetworkMessageIndex];
            // Pagination Object
            currentMessage.Messages.push(this.buildOPCUADataSetMessage(
                {
                    TotalCount: dataSetPayloads.length,
                    PerPage: currentMessage.Messages.length,
                    Page: currentNetworkMessageIndex + 1,
                    HasNext: false,
                    PaginationId: currentMessage.MessageId,
                },
                timestamp,
                parseInt(`${currentMessage.Messages.slice(-1)[0].DataSetWriterId}${currentNetworkMessageIndex}`, 10)
            ));
        }
        // If a specific Page was requested, we only send that Page
        if ((page !== 0 && page > 0)) {
            if (page > networkMessageArray.length) return [];
            // Since the request was for one specific Page, we always set HasNext to false here
            const returnedPage = networkMessageArray[page - 1];
            returnedPage.Messages[returnedPage.Messages.length - 1].Payload.HasNext = false;
            return [returnedPage];
        } else {
            return networkMessageArray;
        }
    }

    /**
     * Builds an OPCUA and OI4-conform Data Message (Including NetworkMessage)
     * @param dataSetPayloads
     * @param timestamp - the current timestamp in Date format
     * @param dataSetClassId
     * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
     */
    buildOPCUANetworkMessage(dataSetPayloads: IOPCUADataSetMessage[], timestamp: Date, dataSetClassId: string, correlationId = ''): IOPCUANetworkMessage {
        const opcUaDataPayload: IOPCUADataSetMessage[] = [];
        // Not sure why empty objects were converted to an empty array. The correct behaviour is building an Empty DataSetMessage...
        // if (Object.keys(actualPayload).length === 0 && actualPayload.constructor === Object) {
        //   opcUaDataPayload = [];
        // } else {
        //   opcUaDataPayload = [this.buildOPCUAData(actualPayload, timestamp)];
        // }
        for (const payload of dataSetPayloads) {
            opcUaDataPayload.push(this.buildOPCUADataSetMessage(payload.Payload, timestamp, payload.DataSetWriterId, payload.Source, payload.Status, payload.Filter, payload.MetaDataVersion));
        }
        const proposedMessageId = `${Date.now().toString()}-${this.publisherId}`;
        const opcUaDataMessage: IOPCUANetworkMessage = {
            MessageId: this.getUniqueMessageId(proposedMessageId),
            MessageType: EOPCUAMessageType.uaData,
            DataSetClassId: dataSetClassId, // TODO: Generate UUID, but not here, make a lookup,
            PublisherId: this.publisherId,
            Messages: opcUaDataPayload,
            CorrelationId: correlationId,
        };

        // change last message only when there wasn't any conflict
        if (proposedMessageId === opcUaDataMessage.MessageId) {
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
     * @param filter - The filter is mandatory, but does not belong to OPC UA DataSetMetaData according to Part 14-7.2.3.4.2-Table 93. In combination with the used resource in the topic, the filter, together with the Source, contains the readable reference to the DataSetWriterId and is identical to the filter in the topic (8.1.7).
     * @param source - The Source is mandatory, but does not belong to OPC UA DataSetMessage according to Part 14-7.2.3.3-Table 92. In combination with the used resource in the topic, the Source, together with the filter, contains the readable reference to the DataSetWriterId and is identical to the Source in the topic (8.1.6) if present.
     * @param correlationId - If the message is a response to a get, or a forward, input the MessageID of the request as the correlation id. Default: ''
     */
    buildOPCUAMetaDataMessage(metaDataName: string, metaDataDescription: string, fieldProperties: any, classId: string, dataSetWriterId: number, filter: string, source: string, correlationId = ''): IOPCUAMetaData {
        const opcUaMetaDataPayload: IOPCUADataSetMetaDataType = this.buildOPCUAMetaData(metaDataName, metaDataDescription, classId, fieldProperties);
        const proposedMessageId = `${Date.now().toString()}-${this.publisherId}`;
        const opcUaMetaDataMessage: IOPCUAMetaData = {
            MessageId: this.getUniqueMessageId(proposedMessageId),
            MessageType: EOPCUAMessageType.uaMetadata,
            PublisherId: this.publisherId,
            DataSetWriterId: dataSetWriterId,
            Filter: filter,
            Source: source,
            CorrelationId: correlationId,
            MetaData: opcUaMetaDataPayload,
        };
        // change only last message if there wasn't any conflict
        if (proposedMessageId === opcUaMetaDataMessage.MessageId) {
            this.lastMessageId = opcUaMetaDataMessage.MessageId;
        }
        return opcUaMetaDataMessage;
    }

    /**
     * Encapsulates Payload inside "Messages" Object of OPCUAData
     * @param actualPayload - the payload (valid key-values) that is to be encapsulated
     * @param timestamp - the current timestamp in Date format
     */
    private buildOPCUADataSetMessage(actualPayload: any, timestamp: Date, dataSetWriterId: number, source: string = this.oi4Id.toString(), status: EOPCUAStatusCode = EOPCUAStatusCode.Good, filter?: string, metaDataVersion?: IOPCUAConfigurationVersionDataType): IOPCUADataSetMessage {
        const opcUaDataPayload: IOPCUADataSetMessage = { // TODO: More elements
            DataSetWriterId: dataSetWriterId,
            Timestamp: timestamp.toISOString(),
            Filter: filter,
            Source: source,
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
            Name: metaDataName,
            DataSetClassId: classId,
            ConfigurationVersion: {
                MajorVersion: 0,
                MinorVersion: 0,
            },
            Description: {
                Locale: EOPCUALocale.enUS,
                Text: metaDataDescription,
            },
            Fields: fieldArray,
        };
        return metaDataObject;
    }

    // Hardcoded dataSetFieldId
    private buildOPCUAMetaDataField(key: string, unit: string, description: string, type: EOPCUABuiltInType, min: number, max: number, valueRank: number): IOPCUAFieldMetaData {
        const field = {
            ValueRank: valueRank,
            Name: key,
            Description: {
                Locale: EOPCUALocale.enUS,
                Text: description,
            },
            FieldFlags: 0, // Currently not parsed
            BuiltInType: type,
            DataType: { // Currently not parsed, should be the NodeID of builtInType
                IdType: 0,
                Id: 1,
            },
            ArrayDimensions: [0], // Initial value, set later
            MaxStringLength: 0, // Initial value, set later
            DataSetFieldId: uuid(), // TODO: Discuss which uuid needs to be here
            Properties: [ // Partially hardcoded!
                {
                    Key: {
                        Name: 'Unit',
                        Uri: 0,
                    },
                    Value: unit,
                },
                {
                    Key: {
                        Name: 'Min',
                        Uri: 0,
                    },
                    Value: min,
                },
                {
                    Key: {
                        Name: 'Max',
                        Uri: 0,
                    },
                    Value: max,
                },
            ],
        };
        if (type === EOPCUABuiltInType.String) {
            field.MaxStringLength = max; // If The type is a string, we interpret min/max as string-length!
        }
        if (valueRank === EOPCUAValueRank.Array) {
            field.ArrayDimensions = [max];
        }
        if (valueRank === EOPCUAValueRank.Matrix) {
            field.ArrayDimensions = [min, max];
        }
        return field;
    }

    // parseOPCUAData() {
    //
    // }
    //
    // parseOPCUAMetaData() {
    //
    // }

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
            payloadMessageValidation = await this.jsonValidator.validate('Pagination.schema.json', payload);
        } catch (validateErr) {
            payloadMessageValidation = false;
        }
        if (payloadMessageValidation === true) {
            return 'pagination';
        }
        try {
            payloadMessageValidation = await this.jsonValidator.validate('Locale.schema.json', payload);
        } catch (validateErr) {
            payloadMessageValidation = false;
        }
        if (payloadMessageValidation === true) {
            return 'locale';
        }
        return 'none';
    }
}
