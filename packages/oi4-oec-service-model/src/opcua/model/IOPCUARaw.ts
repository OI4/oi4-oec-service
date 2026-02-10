import {EOPCUAMessageType, EOPCUAStatusCode} from './EOPCUA';
import {IOPCUAConfigurationVersionDataType, IOPCUADataSetMessage, IOPCUANetworkMessage} from './IOPCUA';
import {Oi4Identifier} from '../../model/Oi4Identifier';

export function toOPCUANetworkMessageRaw(networkMessage: IOPCUANetworkMessage): IOPCUANetworkMessageRaw {
    const messages: IOPCUADataSetMessageRaw[] = networkMessage.Messages.map(message => {
        return {
            ...message,
            DataSetWriterName: message.DataSetWriterName.toString()
        }
    });
    return {
        ...networkMessage,
        Messages: messages
    } as IOPCUANetworkMessageRaw;
}

export function toOPCUANetworkMessage(networkMessage: IOPCUANetworkMessageRaw): IOPCUANetworkMessage {
    const messages: IOPCUADataSetMessage[] = networkMessage.Messages.map(message => {
        const dataSetWriterName: Oi4Identifier =  typeof message.DataSetWriterName === 'string' ?  Oi4Identifier.fromDNPString(message.DataSetWriterName.toString()) : objectToOi4Identifier(message.DataSetWriterName);

        return {
            ...message,
            DataSetWriterName: dataSetWriterName
        }
    });
    return {
        ...networkMessage,
        Messages: messages
    } as IOPCUANetworkMessage;
}

export interface IOPCUANetworkMessageRaw {
    MessageId: string;
    MessageType: EOPCUAMessageType;
    PublisherId: string; // TODO: string in the format <serviceType>/<appId>, need to add validators
    DataSetClassId: string;
    ReplyTo?: string;
    Messages: IOPCUADataSetMessageRaw[]; // TODO: This should be generic (either Messages or MetaData)
}

// Data Message containing the values
export interface IOPCUADataSetMessageRaw {
    DataSetWriterId: number; // oi4ID
    SequenceNumber?: number;
    MetaDataVersion?: IOPCUAConfigurationVersionDataType;
    Timestamp?: string; // TODO: Date type?
    Status?: EOPCUAStatusCode; //Optional and shall not be shown, when Status = 0 => OK
    WriterGroupName?: string;
    DataSetWriterName: string;
    Payload: any; // TODO: arbitrary object?
}

function objectToOi4Identifier(obj: any): Oi4Identifier {
    return new Oi4Identifier(
        obj['manufacturerUri'],
        obj['model'],
        obj['productCode'],
        obj['serialNumber']
    );
}
