import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EventEmitter} from 'events';
import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {promiseTimeout} from './Timeout';

export interface IGetRequest {
    topicPreamble: string;
    resource: string;
    subResource? : string;
    filter?: string;
    message: IOPCUANetworkMessage;
  }

 export interface IPubResponse
  {
    topic: string;
    rawMessage: Buffer;
  }


export class MessageBusLookup extends EventEmitter
{
    private readonly conformityClient: mqtt.AsyncClient;
    private readonly timeOut: number;

    constructor(mqttClient: mqtt.AsyncClient, timeOut = 1000) {
        super();
        this.conformityClient = mqttClient;
        this.timeOut = timeOut;
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

        const pubReceivedEventName = `${getRequest.resource}${getRequest.topicPreamble}Success`
        
        this.conformityClient.on('message', async (topic, rawMsg) => {
            if (topic === pubTopic) {
                await this.conformityClient.unsubscribe(pubTopic);
                const pubResponse: IPubResponse = {
                    topic : topic,
                    rawMessage : rawMsg,
                };
    
                this.emit(pubReceivedEventName, pubResponse);
            }
        });
        await this.conformityClient.subscribe(pubTopic);
        await this.conformityClient.publish(getTopic, JSON.stringify(getRequest.message));

        return await promiseTimeout(new Promise((resolve) => {
                this.once(pubReceivedEventName, (res) => {
                    resolve(res);
                });
            }),
            this.timeOut, /*tslint:disable-line*/ // 700ms as the timeout
            `getMessage-${getRequest.resource}Error-onTopic-${getTopic}`, /*tslint:disable-line*/
        );
    }
}

