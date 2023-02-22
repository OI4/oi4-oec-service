import {EOPCUAMessageType, EOPCUAStatusCode} from './EOPCUA';
import {IOPCUAConfigurationVersionDataType, IOPCUANetworkMessage} from './IOPCUA';

export function toOPCUANetworkMessageRaw(networkMessage: IOPCUANetworkMessage): IOPCUANetworkMessageRaw {
    const messages: IOPCUADataSetMessageRaw[] = networkMessage.Messages.map(message => {
        return {
            ...message,
            Source: message.Source.toString()
        }
    });
    return {
        ...networkMessage,
        Messages: messages
    } as IOPCUANetworkMessageRaw;
}

export interface IOPCUANetworkMessageRaw {
    MessageId: string;
    MessageType: EOPCUAMessageType;
    PublisherId: string; // TODO: string in the format <serviceType>/<appId>, need to add validators
    DataSetClassId: string;
    CorrelationId?: string;
    Messages: IOPCUADataSetMessageRaw[]; // TODO: This should be generic (either Messages or MetaData)
}

// Data Message containing the values
export interface IOPCUADataSetMessageRaw {
    DataSetWriterId: number; // oi4ID
    SequenceNumber?: number;
    MetaDataVersion?: IOPCUAConfigurationVersionDataType;
    Timestamp?: string; // TODO: Date type?
    Status?: EOPCUAStatusCode; //Optional and shall not be shown, when Status = 0 => OK
    Filter?: string;
    Source: string;
    Payload: any; // TODO: arbitrary object?
}
