import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter, IApplicationResources
} from '@oi4/oi4-oec-service-model';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {ClientPayloadHelper} from './ClientPayloadHelper';
import {Logger} from '@oi4/oi4-oec-service-logger';

export class ClientCallbacksHelper {

    private clientPayloadHelper: ClientPayloadHelper;
    private componentLogger: Logger;

    constructor(clientPayloadHelper: ClientPayloadHelper, logger: Logger) {
        this.clientPayloadHelper = clientPayloadHelper;
        this.componentLogger = logger;
    }

    public async onErrorCallback(err: Error) {
        this.componentLogger.log(`Error in mqtt client: ${err}`);
    };

    public async onCloseCallback(applicationResources: IApplicationResources, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        applicationResources.brokerState = false;
        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                Payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: CDataSetWriterIdLookup['health']
            }], new Date(), DataSetClassIds.mam)),
        );
        this.componentLogger.log('Connection to mqtt broker closed');
    };

    public async onDisconnectCallback(applicationResources: IApplicationResources) {
        applicationResources.brokerState = false;
        this.componentLogger.log('Disconnected from mqtt broker');
    };

    public async onReconnectCallback(applicationResources: IApplicationResources) {
        applicationResources.brokerState = false;
        this.componentLogger.log('Reconnecting to mqtt broker');
    };

    public async onClientConnectCallback(applicationResources: IApplicationResources, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        this.componentLogger.log('Connected successfully', ESyslogEventFilter.warning);
        applicationResources.brokerState = true;

        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                Payload: applicationResources.mam,
                DataSetWriterId: CDataSetWriterIdLookup['mam']
            }], new Date(), DataSetClassIds.mam)),
        );
        this.componentLogger.log(`Published Birthmessage on ${topicPreamble}/pub/mam/${oi4Id}`, ESyslogEventFilter.warning);
    };


}
