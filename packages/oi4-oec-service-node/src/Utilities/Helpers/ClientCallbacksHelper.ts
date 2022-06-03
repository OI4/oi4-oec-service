import {CDataSetWriterIdLookup, DataSetClassIds, EDeviceHealth, IContainerState} from "@oi4/oi4-oec-service-model";
import {OPCUABuilder} from "@oi4/oi4-oec-service-opcua-model";
import {ClientPayloadHelper} from "./ClientPayloadHelper";

export class ClientCallbacksHelper {

    private clientPayloadHelper: ClientPayloadHelper;

    constructor(clientPayloadHelper: ClientPayloadHelper) {
        this.clientPayloadHelper = clientPayloadHelper;
    }

    public async onErrorCallback(err: Error) {
        console.log(`Error in mqtt client: ${err}`);
    };

    //FIXME client is mqtt.AsyncClient type, must be pplied
    public async onCloseCallback(containerState: IContainerState, client: any, topicPreamble: string, oi4Id: string, builder: OPCUABuilder) {
        containerState.brokerState = false;
        await client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(builder.buildOPCUANetworkMessage([{
                payload: this.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                dswid: CDataSetWriterIdLookup['health']
            }], new Date(), DataSetClassIds.mam)),
        );
        console.log('Connection to mqtt broker closed');
    };

}