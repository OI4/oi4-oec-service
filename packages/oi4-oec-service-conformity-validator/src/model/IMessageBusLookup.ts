import {Resource} from '@oi4/oi4-oec-service-model';


export class GetRequest {
    TopicPreamble: string;
    Resource: Resource;
    SubResource? : string;
    Filter?: string;
    JsonMessage: string;

    constructor(topicPreamble: string, resource: Resource, jsonMessage: string, subResource?: string, filter?: string) {
        this.TopicPreamble = topicPreamble;
        this.Resource = resource;
        this.JsonMessage = jsonMessage;
        this.SubResource = subResource;
        this.Filter = filter;
    }

    public getTopic(action = 'pub'): string {
        let topic = `${this.TopicPreamble}/${action}/${this.Resource}`;
        if (GetRequest.isNotEmpty(this.SubResource)) {
            topic = `${this.TopicPreamble}/${action}/${this.Resource}/${this.SubResource}`;
        }
        if (GetRequest.isNotEmpty(this.SubResource) && GetRequest.isNotEmpty(this.Filter)) {
            topic = `${this.TopicPreamble}/${action}/${this.Resource}/${this.SubResource}/${this.Filter}`;
        }

        return topic;
    }

    private static isNotEmpty(input: string | undefined): boolean {
        return input != undefined && input != null && input.length > 0;
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
