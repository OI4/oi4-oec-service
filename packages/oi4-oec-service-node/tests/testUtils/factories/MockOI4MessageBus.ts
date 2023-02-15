import mqtt = require('async-mqtt');
import {IOI4MessageBus, IOI4Application, TopicInfo} from '../../../src';
import {IClientCallbacksHelper} from '../../../src/messaging/ClientCallbacksHelper';
import {IClientPublishOptions, ISubscriptionGrant} from 'mqtt';
import {logger} from '@oi4/oi4-oec-service-logger';

export class MockOI4MessageBus implements IOI4MessageBus {

    readonly client: mqtt.AsyncClient;

    initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4application: IOI4Application, clientConnectCallback: Promise<void>): void {
        logger.log(`initClientCallbacks called with clientCallbacksHelper: ${clientCallbacksHelper}, oi4application: ${oi4application}, clientConnectCallback: ${clientConnectCallback}`);
    }

    publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<void> {
        logger.log(`initClientCallbacks called with topic: ${topic}, message: ${message}, opts: ${opts}`);
        return Promise.resolve(undefined);
    }

    subscribe(topicInfo: TopicInfo): Promise<ISubscriptionGrant[]> {
        logger.log(`subscribe called with topicInfo: ${topicInfo}`);
        return Promise.resolve([]);
    }

    unsubscribe(topicInfo: TopicInfo): Promise<void> {
        logger.log(`unsubscribe called with topicInfo: ${topicInfo}`);
        return Promise.resolve(undefined);
    }

}
