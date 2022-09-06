import {IOI4Application} from '../../../dist/application/OI4Application';
import {
    IEvent,
    IOI4ApplicationResources,
    MasterAssetModel, Resource,
    StatusEvent,
    SubscriptionListConfig
} from '@oi4/oi4-oec-service-model';
import {Oi4Identifier, OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {ClientPayloadHelper} from '../../../dist/Utilities/Helpers/ClientPayloadHelper';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import EventEmitter from 'events';

export class MockOi4Application extends EventEmitter implements IOI4Application {
    applicationResources: IOI4ApplicationResources;
    builder: OPCUABuilder;
    client: mqtt.AsyncClient;
    clientPayloadHelper: ClientPayloadHelper;
    serviceType: ServiceTypes;
    topicPreamble: string;

    constructor(applicationResources: IOI4ApplicationResources, serviceType: ServiceTypes) {
        super();
        this.applicationResources = applicationResources;
        this.serviceType = serviceType;
        this.topicPreamble = `${this.serviceType}/${this.applicationResources.oi4Id}`;
    }

    sendData(_oi4Id: Oi4Identifier, _data?: any, _filter?: string, _messageId?: string) {
        return Promise.resolve(undefined);
    }

    get oi4Id(){
        return this.applicationResources.oi4Id;
    }

    addSubscription(topic: string, config: SubscriptionListConfig, interval: number): Promise<mqtt.ISubscriptionGrant[]> {
        LOGGER.log(`addSubscription called with topic: ${topic}, config: ${JSON.stringify(config)}, interval: ${interval}`);
        return Promise.resolve([]);
    }

    getConfig(): Promise<void> {
        return Promise.resolve(undefined);
    }

    removeSubscription(topic: string): Promise<boolean> {
        LOGGER.log(`removeSubscription called with topic: ${topic}`);
        return Promise.resolve(false);
    }

    sendEvent(event: IEvent, filter: string): Promise<void> {
        LOGGER.log(`sendEvent called with event: ${event}, filter: ${filter}`);
        return Promise.resolve(undefined);
    }

    sendEventStatus(status: StatusEvent): Promise<void> {
        LOGGER.log(`sendEventStatus called with status: ${status}`);
        return Promise.resolve(undefined);
    }

    sendMasterAssetModel(mam: MasterAssetModel, messageId?: string): Promise<void> {
        LOGGER.log(`sendMasterAssetModel called with mam: ${mam}, messageId: ${messageId}`);
        return Promise.resolve(undefined);
    }

    sendMetaData(cutTopic: string): Promise<void> {
        LOGGER.log(`sendMetaData called with cutTopic: ${cutTopic}`);
        return Promise.resolve(undefined);
    }

    sendResource(resource: Resource, messageId: string, source: string, filter: string, page: number, perPage: number): Promise<void> {
        LOGGER.log(`sendResource called with resource: ${resource}, messageId: ${messageId}, source: ${source}, filter: ${filter}, page: ${page}, perPage: ${perPage}`);
        return Promise.resolve(undefined);
    }

}
