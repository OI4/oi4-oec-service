import {Methods, Oi4Identifier, Resources} from '@oi4/oi4-oec-service-model';

export class GetRequest {
    TopicPreamble: string;
    Resource: Resources;
    Source?: Oi4Identifier;
    Filter?: string;
    JsonMessage: string;

    constructor(topicPreamble: string, resource: Resources, jsonMessage: string, source?: Oi4Identifier, filter?: string) {
        this.TopicPreamble = topicPreamble;
        this.Resource = resource;
        this.JsonMessage = jsonMessage;
        this.Source = source;
        this.Filter = filter;
    }

    public getTopic(action: string = Methods.PUB): string {
        let topic = `${this.TopicPreamble}/${action}/${this.Resource}`;
        if (this.Source === undefined) {
            return;
        }
        topic = `${this.TopicPreamble}/${action}/${this.Resource}/${this.Source}`;

        if (GetRequest.isNotEmpty(this.Filter)) {
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

    constructor(topic: string, rawMessage: Buffer) {
        this.Topic = topic;
        this.RawMessage = rawMessage;
    }
}

export interface IMessageBusLookup {
    getMessage(getRequest: GetRequest): Promise<PubResponse>;
}
