import {
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    Resources,
    DataSetWriterIdManager
} from '@oi4/oi4-oec-service-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {OI4Application} from '../../application/OI4Application'; /*tslint:disable-line*/

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
                Source: oi4Id.toString(),
                Payload: oi4application.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.HEALTH, oi4Id.toString()),
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
        LOGGER.log('Connected successfully', ESyslogEventFilter.informational);

        const applicationResources = oi4application.applicationResources;
        await oi4application.sendMasterAssetModel(applicationResources.mam).then();
        LOGGER.log('Published birth message', ESyslogEventFilter.informational);
        for(const source of applicationResources.sources.values()){
            await oi4application.sendMasterAssetModel(source.mam).then();
        }
    };

    async onOfflineCallback() {
        LOGGER.log('Broker went offline or failed to connect');
    }

}
