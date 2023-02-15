import {
    DataSetClassIds,
    DataSetWriterIdManager,
    EDeviceHealth,
    ESyslogEventFilter,
    Methods,
    Resources
} from '@oi4/oi4-oec-service-model';
import {logger} from '@oi4/oi4-oec-service-logger';
import {IOI4Application} from '../application/OI4Application';

export interface IClientCallbacksHelper {
    onErrorCallback(err: Error): Promise<void>;

    onCloseCallback(oi4application: IOI4Application): Promise<void>;

    onDisconnectCallback(): Promise<void>;

    onReconnectCallback(): Promise<void>;

    onClientConnectCallback(oi4application: IOI4Application): Promise<void>;

    onOfflineCallback(): Promise<void>;
}

export class ClientCallbacksHelper implements IClientCallbacksHelper {

    async onErrorCallback(err: Error): Promise<void> {
        logger.log(`Error in mqtt client: ${err}`);
    };

    async onCloseCallback(oi4application: IOI4Application): Promise<void> {
        const oi4Id = oi4application.oi4Id;
        const topicPreamble = oi4application.topicPreamble;

        await oi4application.messageBus.publish(
            `${topicPreamble}/${Methods.PUB}/${Resources.MAM}/${oi4Id}`,
            JSON.stringify(oi4application.builder.buildOPCUANetworkMessage([{
                Source: oi4Id,
                Payload: oi4application.clientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 0),
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.HEALTH, oi4Id),
            }], new Date(), DataSetClassIds.mam)),
        );
        logger.log('Connection to mqtt broker closed');
    };

    async onDisconnectCallback(): Promise<void> {
        logger.log('Disconnected from mqtt broker');
    };

    async onReconnectCallback(): Promise<void> {
        logger.log('Reconnecting to mqtt broker');
    };

    async onClientConnectCallback(oi4application: IOI4Application): Promise<void> {
        logger.log('Connected successfully', ESyslogEventFilter.informational);

        const applicationResources = oi4application.applicationResources;
        await oi4application.sendMasterAssetModel(applicationResources.mam).then();
        logger.log('Published birth message', ESyslogEventFilter.informational);
        for (const source of applicationResources.sources.values()) {
            await oi4application.sendMasterAssetModel(source.mam).then();
        }
    };

    async onOfflineCallback(): Promise<void> {
        logger.log('Broker went offline or failed to connect');
    }

}
