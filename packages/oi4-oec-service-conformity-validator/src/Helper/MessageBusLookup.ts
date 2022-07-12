import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EventEmitter} from 'events';
import {promiseTimeout} from './Timeout';
import {IMessageBusLookup, PubResponse, GetRequest} from '../model/IMessageBusLookup';


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
                const pubResponse = new PubResponse(topic, rawMsg);
                this.pubMessages.emit(topic, pubResponse);
            }
        });
    }

    /**
     * Requests a resource for a given asset.
     * Returns the resource if available.
     * Returns an error if the resource is not available within a given timeframe.
     * @param getRequest - The asset information and the message that is used to request the resource.
     */
     async getMessage(getRequest: GetRequest): Promise<PubResponse> {
        const pubTopic = getRequest.getTopic('pub');
        const getTopic = getRequest.getTopic('get');

        
        await this.conformityClient.subscribe(pubTopic);
        await this.conformityClient.publish(getTopic, JSON.stringify(getRequest.Message));

        return await promiseTimeout(new Promise((resolve) => {
                this.pubMessages.once(pubTopic, (res) => {
                    this.conformityClient.unsubscribe(pubTopic);
                    resolve(res);
                });
            }),
            this.timeOut, 
            `getMessage-${getRequest.Resource}Error-onTopic-${getTopic}`, 
        );
    }
}

