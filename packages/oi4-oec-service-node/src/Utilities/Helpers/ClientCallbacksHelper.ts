import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter, IOI4ApplicationResources
} from '@oi4/oi4-oec-service-model';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {ClientPayloadHelper} from './ClientPayloadHelper';
import {logger} from '@oi4/oi4-oec-service-logger';

export class ClientCallbacksHelper {

    private clientPayloadHelper: ClientPayloadHelper;

    constructor(clientPayloadHelper: ClientPayloadHelper) {
        this.clientPayloadHelper = clientPayloadHelper;
    }

    public async onErrorCallback(err: Error) {
        logger.log(`Error in mqtt client: ${err}`);
    };

    public async onCloseCallback(applicationResources: IOI4ApplicationResources, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        applicationResources.brokerState = false;
        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: CDataSetWriterIdLookup['health']
            }], new Date(), DataSetClassIds.mam)),
        );
        logger.log('Connection to mqtt broker closed');
    };

    public async onDisconnectCallback(applicationResources: IOI4ApplicationResources) {
        applicationResources.brokerState = false;
        logger.log('Disconnected from mqtt broker');
    };

    public async onReconnectCallback(applicationResources: IOI4ApplicationResources) {
        applicationResources.brokerState = false;
        logger.log('Reconnecting to mqtt broker');
    };

    public async onClientConnectCallback(applicationResources: IOI4ApplicationResources, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        logger.log('Connected successfully', ESyslogEventFilter.warning);
        applicationResources.brokerState = true;

        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                Payload: applicationResources.mam,
                DataSetWriterId: CDataSetWriterIdLookup['mam']
            }], new Date(), DataSetClassIds.mam)),
        );
        logger.log(`Published Birthmessage on ${topicPreamble}/pub/mam/${oi4Id}`, ESyslogEventFilter.warning);
    };


}
