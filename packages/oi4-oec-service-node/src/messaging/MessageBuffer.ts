import {TopicInfo} from '../topic/TopicModel';
import {IOPCUADataSetMessage, IOPCUANetworkMessage, Oi4Identifier} from '@oi4/oi4-oec-service-model';

export interface IMessageBuffer {
    pushMessage(topicInfo: TopicInfo, networkMessage: IOPCUANetworkMessage, dataSetMessage:IOPCUADataSetMessage): void;

    pop(oi4Id: Oi4Identifier): [TopicInfo, IOPCUANetworkMessage, IOPCUADataSetMessage];

    length(oi4Id: Oi4Identifier): number;
}

export class MessageBuffer implements IMessageBuffer {

    private readonly maxSize;
    private readonly messages: Map<string, OI4Message[]>;

    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.messages = new Map();
    }

    public pushMessage(topicInfo: TopicInfo, networkMessage: IOPCUANetworkMessage, dataSetMessage: IOPCUADataSetMessage): void {
        if (topicInfo === undefined || topicInfo.source === undefined) {
            return;
        }
        const queue = this.getQueue(topicInfo.source);
        if (queue.length === this.maxSize) {
            queue.shift();
        }
        queue.push({topicInfo, networkMessage, dataSetMessage});
        this.messages.set(topicInfo.source.toString(), queue);
    }

    public pop(oi4Id: Oi4Identifier): [TopicInfo, IOPCUANetworkMessage, IOPCUADataSetMessage] {
        if (oi4Id === undefined) {
            return [undefined, undefined, undefined];
        }
        const queue = this.getQueue(oi4Id);
        const result = queue.pop();
        this.messages.set(oi4Id.toString(), queue);
        return [result?.topicInfo, result?.networkMessage, result?.dataSetMessage];
    }

    public length(oi4Id: Oi4Identifier): number {
        return this.getQueue(oi4Id).length;
    }

    private getQueue(oi4Id: Oi4Identifier): OI4Message[] {
        const id = oi4Id?.toString();
        return this.messages.has(id) ? this.messages.get(id) : [];
    }
}

export interface OI4Message {
    topicInfo: TopicInfo;
    networkMessage: IOPCUANetworkMessage;
    dataSetMessage: IOPCUADataSetMessage;
}
