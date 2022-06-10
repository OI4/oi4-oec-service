import {
    CDataSetWriterIdLookup,
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    IContainerState
} from '@oi4/oi4-oec-service-model';
import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {ClientPayloadHelper} from './ClientPayloadHelper';
import {Logger} from '@oi4/oi4-oec-service-logger';

export class ClientCallbacksHelper {

    private componentLogger: Logger;

    constructor(logger: Logger) {
        this.componentLogger = logger;
    }

    public async onErrorCallback(err: Error) {
        console.log(`Error in mqtt client: ${err}`);
    };

    public async onCloseCallback(containerState: IContainerState, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        containerState.brokerState = false;
        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                payload: ClientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                dswid: CDataSetWriterIdLookup['health']
            }], new Date(), DataSetClassIds.mam)),
        );
        console.log('Connection to mqtt broker closed');
    };

    public async onDisconnectCallback(containerState: IContainerState) {
        containerState.brokerState = false;
        console.log('Disconnected from mqtt broker');
    };

    public async onReconnectCallback(containerState: IContainerState) {
        containerState.brokerState = false;
        console.log('Reconnecting to mqtt broker');
    };

    public async onClientConnectCallback(containerState: IContainerState, client: mqtt.AsyncClient, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        this.componentLogger.log('Connected successfully', ESyslogEventFilter.warning);
        containerState.brokerState = true;

        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                payload: containerState.mam,
                dswid: CDataSetWriterIdLookup['mam']
            }], new Date(), DataSetClassIds.mam)),
        );
        this.componentLogger.log(`Published Birthmessage on ${topicPreamble}/pub/mam/${oi4Id}`, ESyslogEventFilter.warning);
    };


}