import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {Resources} from '@oi4/oi4-oec-service-model';


export class GetRequest {
    TopicPreamble: string;
    Resource: Resources;
    Source? : string;
    Filter?: string;
    Message: IOPCUANetworkMessage;

    constructor(topicPreamble: string, resource: Resources, message: IOPCUANetworkMessage, source?: string, filter?: string) {
        this.TopicPreamble = topicPreamble;
        this.Resource = resource;
        this.Message = message;
        this.Source = source;
        this.Filter = filter;
    }

    public getTopic(action = 'pub'): string {
        let topic = `${this.TopicPreamble}/${action}/${this.Resource}`;
        if (GetRequest.isNotEmpty(this.Source)) {
            topic = `${this.TopicPreamble}/${action}/${this.Resource}/${this.Source}`;
        }
        if (GetRequest.isNotEmpty(this.Source) && GetRequest.isNotEmpty(this.Filter)) {
            topic = `${this.TopicPreamble}/${action}/${this.Resource}/${this.Source}/${this.Filter}`;
        }

        return topic;
    }

    private static isNotEmpty(input: string | undefined): boolean {
        return input != undefined && true && input.length > 0;
    }
}

export class PubResponse {
    Topic: string;
    RawMessage: Buffer;

    constructor(topic: string, rawMessage: Buffer)
    {
        this.Topic = topic;
        this.RawMessage = rawMessage;
    }
}

export interface IMessageBusLookup {
    getMessage(getRequest: GetRequest): Promise<PubResponse>;
}
