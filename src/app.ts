import { OI4MessageBusProxy } from './Proxy/Messagebus/index';
import { OI4WebProxy } from './Proxy/Web/index';
import { ContainerState } from './Container/index';
import { EGenericEventFilter } from './Models/IContainer';
import { Logger } from './Utilities/Logger/index';
import dotenv from 'dotenv';
import path from 'path';

// Here, we get our configuration from Environment variables. If either of them is not specified, we use a provided .env file
if (!(process.env.OI4_EDGE_MQTT_BROKER_ADDRESS) ||
  !(process.env.OI4_EDGE_MQTT_SECURE_PORT) ||
  !(process.env.OI4_EDGE_APPLICATION_INSTANCE_NAME) ||
  !(process.env.USE_HTTPS) ||
  !(process.env.OI4_EDGE_EVENT_LEVEL)) {
  dotenv.config({ path: path.join(__dirname, '.env') });
  if (!(process.env.OI4_EDGE_EVENT_LEVEL) || !(process.env.OI4_EDGE_EVENT_LEVEL in EGenericEventFilter)) {
    console.log('Init: LOG_LEVEL either not specified or wrong enum value');
    process.env.OI4_EDGE_EVENT_LEVEL = 'medium';
  }
}

const contState = new ContainerState();
const busProxy = new OI4MessageBusProxy(contState);
const webProxy = new OI4WebProxy(contState);
const logger = new Logger(true, 'OI4-Base-Service', process.env.OI4_EDGE_EVENT_LEVEL as EGenericEventFilter, busProxy.mqttClient, busProxy.oi4Id, busProxy.serviceType);
logger.level = EGenericEventFilter.high;
logger.log(`Testprint for level ${EGenericEventFilter.low}`, EGenericEventFilter.low);
logger.log(`Testprint for level ${EGenericEventFilter.medium}`, EGenericEventFilter.medium);
logger.log(`Testprint for level ${EGenericEventFilter.high}`, EGenericEventFilter.high);
logger.level = EGenericEventFilter.medium;