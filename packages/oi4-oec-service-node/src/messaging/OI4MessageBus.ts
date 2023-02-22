import mqtt = require('async-mqtt');
import {MqttSettings} from '../application/MqttSettings';
import {AsyncClientEvents} from './MessagingModel';
import {IClientCallbacksHelper} from './ClientCallbacksHelper';
import {IOI4Application} from '../application/OI4Application';
import {IClientPublishOptions, ISubscriptionGrant} from 'mqtt';
import {IOPCUADataSetMetaData, IOPCUANetworkMessage, toOPCUANetworkMessageRaw} from '@oi4/oi4-oec-service-model';

export interface IOI4MessageBus {

    getClient(): mqtt.AsyncClient;

    connect(mqttSettings: MqttSettings, oi4Application: IOI4Application): void;

    initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4application: IOI4Application, clientConnectCallback: Promise<void>): void;

    subscribe(topic: string): Promise<ISubscriptionGrant[]>;

    unsubscribe(topic: string): Promise<void>;

    publish(topic: string, networkMessage: IOPCUANetworkMessage, opts?: IClientPublishOptions): Promise<void>;

    publishMetaData(topic: string, metaData: IOPCUADataSetMetaData, opts?: IClientPublishOptions): Promise<void>;
}

export class OI4MessageBus implements IOI4MessageBus {

    private client: mqtt.AsyncClient;

    public connect(mqttSettings: MqttSettings, oi4Application: IOI4Application): void {
        this.client = mqtt.connect(mqttSettings);
        this.client.on(AsyncClientEvents.MESSAGE, async (topic: string, payload: Buffer) => oi4Application.mqttMessageProcessor.processMqttMessage(topic, payload, oi4Application.builder, oi4Application));
    }

    public initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4Application: IOI4Application, clientConnectCallback: Promise<void>): void {
        this.client.on(AsyncClientEvents.ERROR, async (err: Error) => clientCallbacksHelper.onErrorCallback(err));
        this.client.on(AsyncClientEvents.CLOSE, async () => clientCallbacksHelper.onCloseCallback(oi4Application));
        this.client.on(AsyncClientEvents.DISCONNECT, async () => clientCallbacksHelper.onDisconnectCallback());
        this.client.on(AsyncClientEvents.RECONNECT, async () => clientCallbacksHelper.onReconnectCallback());
        this.client.on(AsyncClientEvents.OFFLINE, async () => clientCallbacksHelper.onOfflineCallback());
        // Publish Birth Message and start listening to topics
        this.client.on(AsyncClientEvents.CONNECT, async () => clientConnectCallback);
    }

    public getClient(): mqtt.AsyncClient {
        return this.client;
    }

    public subscribe(topic: string): Promise<ISubscriptionGrant[]> {
        return this.client.subscribe(topic);
    }

    public unsubscribe(topic: string): Promise<void> {
        return this.client.unsubscribe(topic)
    }

    public publish(topic: string, networkMessage: IOPCUANetworkMessage, opts?: IClientPublishOptions): Promise<void> {
        const message = JSON.stringify(toOPCUANetworkMessageRaw(networkMessage));
        return this.client.publish(topic, message, opts);
    }

    public publishMetaData(topic: string, metaData: IOPCUADataSetMetaData, opts?: IClientPublishOptions): Promise<void> {
        const message = JSON.stringify(metaData);
        return this.client.publish(topic, message, opts);
    }

}

