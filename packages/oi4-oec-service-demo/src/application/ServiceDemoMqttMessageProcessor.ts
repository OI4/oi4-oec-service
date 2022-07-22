import {MqttMessageProcessor, TopicInfo} from '@oi4/oi4-oec-service-node';
import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter} from '@oi4/oi4-oec-service-model';

export class ServiceDemoMqttMessageProcessor extends MqttMessageProcessor {

    protected handleForeignMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage) {
        LOGGER.log(`Detected Message from: ${topicInfo.appId} with messageId: ${parsedMessage.MessageId}`, ESyslogEventFilter.informational);
    }
}
