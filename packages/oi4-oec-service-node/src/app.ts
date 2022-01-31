import { OI4MessageBusProxy } from './Proxy/Messagebus';
// import { OI4WebProxy } from './Proxy/Web';
import { ContainerState } from './Container';
import { Logger } from '@oi4/oi4-oec-service-logger';
import dotenv from 'dotenv';
import path from 'path';
import { ESyslogEventFilter } from '@oi4/oi4-oec-service-model';

// Here, we get our configuration from Environment variables. If either of them is not specified, we use a provided .env file
if (!(process.env.OI4_EDGE_MQTT_BROKER_ADDRESS) ||
    !(process.env.OI4_EDGE_MQTT_SECURE_PORT) ||
    !(process.env.OI4_EDGE_APPLICATION_INSTANCE_NAME) ||
    !(process.env.USE_HTTPS) ||
    !(process.env.OI4_EDGE_EVENT_LEVEL)) {
    dotenv.config({ path: path.join(__dirname, '.env') });
    if (!(process.env.OI4_EDGE_EVENT_LEVEL) || !(process.env.OI4_EDGE_EVENT_LEVEL in ESyslogEventFilter)) {
        console.log('Init: LOG_LEVEL either not specified or wrong enum value');
        process.env.OI4_EDGE_EVENT_LEVEL = 'warning';
    }
}

const contState = new ContainerState();
const busProxy = new OI4MessageBusProxy(contState);
// const webProxy = new OI4WebProxy(contState);
const logger = new Logger(true, 'OI4-Base-Service', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, busProxy.mqttClient, busProxy.oi4Id, busProxy.serviceType);
logger.level = ESyslogEventFilter.emergency;
logger.log(`Testprint for level ${ESyslogEventFilter.debug}`, ESyslogEventFilter.debug);
logger.log(`Testprint for level ${ESyslogEventFilter.informational}`, ESyslogEventFilter.informational);
logger.log(`Testprint for level ${ESyslogEventFilter.notice}`, ESyslogEventFilter.notice);
logger.log(`Testprint for level ${ESyslogEventFilter.warning}`, ESyslogEventFilter.warning);
logger.log(`Testprint for level ${ESyslogEventFilter.error}`, ESyslogEventFilter.error);
logger.log(`Testprint for level ${ESyslogEventFilter.critical}`, ESyslogEventFilter.critical);
logger.log(`Testprint for level ${ESyslogEventFilter.alert}`, ESyslogEventFilter.alert);
logger.log(`Testprint for level ${ESyslogEventFilter.emergency}`, ESyslogEventFilter.emergency);
logger.level = ESyslogEventFilter.warning;
