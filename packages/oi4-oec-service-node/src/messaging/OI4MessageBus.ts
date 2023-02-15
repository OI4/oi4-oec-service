import mqtt = require('async-mqtt');
import {MqttSettings} from '../application/MqttSettings';
import {AsyncClientEvents} from './MessagingModel';
import {IClientCallbacksHelper} from './ClientCallbacksHelper';
import {IOI4Application} from '../application/OI4Application';
import {IClientPublishOptions, ISubscriptionGrant} from 'mqtt';
import {IMqttMessageProcessor} from './MqttMessageProcessor';

export interface IOI4MessageBus {

    readonly client: mqtt.AsyncClient;

    initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4application: IOI4Application, clientConnectCallback: Promise<void>): void;

    subscribe(topic: string): Promise<ISubscriptionGrant[]>;

    unsubscribe(topic: string): Promise<void>;

    publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<void>;
}

export class OI4MessageBus implements IOI4MessageBus {

    public readonly client: mqtt.AsyncClient;

    constructor(mqttSettings: MqttSettings, oi4Application: IOI4Application, mqttMessageProcessor: IMqttMessageProcessor) {
        this.client = mqtt.connect(mqttSettings);
        this.client.on(AsyncClientEvents.MESSAGE, async (topic: string, payload: Buffer) => mqttMessageProcessor.processMqttMessage(topic, payload, oi4Application.builder, oi4Application));
    }

    public initClientCallbacks(clientCallbacksHelper: IClientCallbacksHelper, oi4application: IOI4Application, clientConnectCallback: Promise<void>): void {
        this.client.on(AsyncClientEvents.ERROR, async (err: Error) => clientCallbacksHelper.onErrorCallback(err));
        this.client.on(AsyncClientEvents.CLOSE, async () => clientCallbacksHelper.onCloseCallback(oi4application));
        this.client.on(AsyncClientEvents.DISCONNECT, async () => clientCallbacksHelper.onDisconnectCallback());
        this.client.on(AsyncClientEvents.RECONNECT, async () => clientCallbacksHelper.onReconnectCallback());
        this.client.on(AsyncClientEvents.OFFLINE, async () => clientCallbacksHelper.onOfflineCallback());
        // Publish Birth Message and start listening to topics
        this.client.on(AsyncClientEvents.CONNECT, async () => clientConnectCallback);
    }

    public subscribe(topic: string): Promise<ISubscriptionGrant[]> {
        return this.client.subscribe(topic);
    }

    public unsubscribe(topic: string): Promise<void> {
        return this.client.unsubscribe(topic)
    }

    public publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<void> {
        return this.client.publish(topic, message, opts);
    }

}

