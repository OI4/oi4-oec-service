import {
    DataSetClassIds,
    EDeviceHealth,
    ESyslogEventFilter,
    Resources,
    DataSetWriterIdManager, Methods
} from '@oi4/oi4-oec-service-model';
import {logger} from '@oi4/oi4-oec-service-logger';
import {OI4Application} from '../application/OI4Application'; /*tslint:disable-line*/

export class ClientCallbacksHelper {

    async onErrorCallback(err: Error) {
        logger.log(`Error in mqtt client: ${err}`);
    };

    async onCloseCallback(oi4application: OI4Application) {
        const oi4Id = oi4application.oi4Id;
        const topicPreamble = oi4application.topicPreamble;

        await oi4application.client.publish(
            `${topicPreamble}/${Methods.PUB}/${Resources.MAM}/${oi4Id}`,
            JSON.stringify(oi4application.builder.buildOPCUANetworkMessage([{
                Source: oi4Id.toString(),
                Payload: oi4application.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.HEALTH, oi4Id.toString()),
            }], new Date(), DataSetClassIds.mam)),
        );
        logger.log('Connection to mqtt broker closed');
    };

    async onDisconnectCallback() {
        logger.log('Disconnected from mqtt broker');
    };

    async onReconnectCallback() {
        logger.log('Reconnecting to mqtt broker');
    };

    async onClientConnectCallback(oi4application: OI4Application) {
        logger.log('Connected successfully', ESyslogEventFilter.informational);

        const applicationResources = oi4application.applicationResources;
        await oi4application.sendMasterAssetModel(applicationResources.mam).then();
        logger.log('Published birth message', ESyslogEventFilter.informational);
        for(const source of applicationResources.sources.values()){
            await oi4application.sendMasterAssetModel(source.mam).then();
        }
    };

    async onOfflineCallback() {
        logger.log('Broker went offline or failed to connect');
    }

}
