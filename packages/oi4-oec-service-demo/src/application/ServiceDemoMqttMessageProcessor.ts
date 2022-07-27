import {MqttMessageProcessor, TopicInfo} from '@oi4/oi4-oec-service-node';
import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter} from '@oi4/oi4-oec-service-model';

export class ServiceDemoMqttMessageProcessor extends MqttMessageProcessor {

    async handleForeignMessage(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage) {
        LOGGER.log(`Foreign message from: ${topicInfo.appId} with messageId: ${parsedMessage.MessageId}`, ESyslogEventFilter.informational);
    }
}
