import mqtt = require('async-mqtt');
import {IOI4Application, IOI4MessageBus, MqttSettings} from '../../../src';
import {IClientCallbacksHelper} from '../../../src/messaging/ClientCallbacksHelper';
import {IClientPublishOptions, ISubscriptionGrant} from 'mqtt';
import {logger} from '@oi4/oi4-oec-service-logger';
import {IOPCUADataSetMetaData, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-model';

export class MockOI4MessageBus implements IOI4MessageBus {

    readonly client: mqtt.AsyncClient;
    private connected = false;

    public connect(mqttSettings: MqttSettings, oi4Application: IOI4Application): void {
        this.connected = mqttSettings !== undefined && oi4Application !== undefined;
    }

    initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4application: IOI4Application, clientConnectCallback: () => Promise<void>): void {
        logger.log(`initClientCallbacks called with clientCallbacksHelper: ${clientCallbacksHelper}, oi4application: ${oi4application}, clientConnectCallback: ${clientConnectCallback}`);
    }

    publish(topic: string, networkMessage: IOPCUANetworkMessage, opts?: IClientPublishOptions): Promise<void> {
        logger.log(`publish called with topic: ${topic}, message: ${JSON.stringify(networkMessage)}, opts: ${opts}`);
        return Promise.resolve(undefined);
    }

    public publishMetaData(topic: string, metaData: IOPCUADataSetMetaData, opts?: IClientPublishOptions): Promise<void> {
        logger.log(`publishMetaData called with topic: ${topic}, message: ${JSON.stringify(metaData)}, opts: ${opts}`);
        return Promise.resolve(undefined);
    }

    subscribe(topicInfo: string): Promise<ISubscriptionGrant[]> {
        logger.log(`subscribe called with topicInfo: ${topicInfo}`);
        return Promise.resolve([]);
    }

    unsubscribe(topicInfo: string): Promise<void> {
        logger.log(`unsubscribe called with topicInfo: ${topicInfo}`);
        return Promise.resolve(undefined);
    }

    get isConnected(): boolean {
        return this.connected;
    }

    getClient(): mqtt.AsyncClient {
        return undefined;
    }

}
