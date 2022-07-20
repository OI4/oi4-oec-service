import {
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    Resource,
    DataSetWriterIdManager
} from '@oi4/oi4-oec-service-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {OI4Application} from "../../application/OI4Application"; /*tslint:disable-line*/

export class ClientCallbacksHelper {

    async onErrorCallback(err: Error) {
        LOGGER.log(`Error in mqtt client: ${err}`);
    };

    async onCloseCallback(oi4application: OI4Application) {
        const oi4Id = oi4application.oi4Id;
        const topicPreamble = oi4application.topicPreamble;

        await oi4application.client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(oi4application.builder.buildOPCUANetworkMessage([{
                subResource: oi4Id,
                Payload: oi4application.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.HEALTH, oi4Id),
            }], new Date(), DataSetClassIds.mam)),
        );
        LOGGER.log('Connection to mqtt broker closed');
    };

    async onDisconnectCallback() {
        LOGGER.log('Disconnected from mqtt broker');
    };

    async onReconnectCallback() {
        LOGGER.log('Reconnecting to mqtt broker');
    };

    async onClientConnectCallback(oi4application: OI4Application) {
        const oi4Id = oi4application.oi4Id;
        const topicPreamble = oi4application.topicPreamble;

        LOGGER.log('Connected successfully', ESyslogEventFilter.informational);

        await oi4application.client.publish(
            `${topicPreamble}/pub/mam/${oi4Id}`,
            JSON.stringify(oi4application.builder.buildOPCUANetworkMessage([{
                subResource: oi4Id,
                Payload: oi4application.applicationResources.mam,
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.MAM, oi4Id),
            }], new Date(), DataSetClassIds.mam)),
        );
        LOGGER.log(`Published birth message on ${topicPreamble}/pub/mam/${oi4Id}`, ESyslogEventFilter.informational);
    };

    async onOfflineCallback() {
        LOGGER.log('Broker went offline or failed to connect');
    }

}
