import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EventEmitter} from 'events';
import {promiseTimeout} from './Timeout';
import {IMessageBusLookup, IPubResponse, IGetRequest} from '../model/IMessageBusLookup';


export class MessageBusLookup implements IMessageBusLookup
{
    private readonly pubMessages: EventEmitter;
    private readonly conformityClient: mqtt.AsyncClient;
    private readonly timeOut: number;

    constructor(mqttClient: mqtt.AsyncClient, timeOut = 1000) {
        this.pubMessages = new EventEmitter();
        this.conformityClient = mqttClient;
        this.timeOut = timeOut;

        this.conformityClient.on('message', async (topic, rawMsg) => {
            if (topic.includes('pub')) {
                const pubResponse: IPubResponse = {
                    topic : topic,
                    rawMessage : rawMsg,
                };
    
                this.pubMessages.emit(topic, pubResponse);
            }
        });
    }

    private static isNotEmpty(input: string | undefined): boolean {
        return input != undefined && input != null && input.length > 0;
    }

    /**
     * Requests a resource for a given asset.
     * Returns the resource if available.
     * Returns an error if the resource is not available within a given timeframe.
     * @param getRequest - The asset information and the message that is used to request the resource.
     */
     async getMessage(getRequest: IGetRequest): Promise<IPubResponse> {
        let pubTopic = `${getRequest.topicPreamble}/pub/${getRequest.resource}`;
        let getTopic = `${getRequest.topicPreamble}/get/${getRequest.resource}`;
        if (MessageBusLookup.isNotEmpty(getRequest.subResource)) {
            pubTopic = `${getRequest.topicPreamble}/pub/${getRequest.resource}/${getRequest.subResource}`;
            getTopic = `${getRequest.topicPreamble}/get/${getRequest.resource}/${getRequest.subResource}`;
        }
        if (MessageBusLookup.isNotEmpty(getRequest.subResource) && MessageBusLookup.isNotEmpty(getRequest.filter)) {
            pubTopic = `${getRequest.topicPreamble}/pub/${getRequest.resource}/${getRequest.subResource}/${getRequest.filter}`;
            getTopic = `${getRequest.topicPreamble}/get/${getRequest.resource}/${getRequest.subResource}/${getRequest.filter}`;
        }

        
        await this.conformityClient.subscribe(pubTopic);
        await this.conformityClient.publish(getTopic, JSON.stringify(getRequest.message));

        return await promiseTimeout(new Promise((resolve) => {
                this.pubMessages.once(pubTopic, (res) => {
                    this.conformityClient.unsubscribe(pubTopic);
                    resolve(res);
                });
            }),
            this.timeOut, 
            `getMessage-${getRequest.resource}Error-onTopic-${getTopic}`, 
        );
    }
}

