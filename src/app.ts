import { OI4MessageBusProxy } from './Proxy/Messagebus/index';
import { OI4WebProxy } from './Proxy/Web/index';
import { ContainerState } from './Container/index';
import { ESubResource } from './Models/IContainer';
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
  if (!(process.env.OI4_EDGE_EVENT_LEVEL) || !(process.env.OI4_EDGE_EVENT_LEVEL in ESubResource)) {
    console.log('Init: LOG_LEVEL either not specified or wrong enum value');
    process.env.OI4_EDGE_EVENT_LEVEL = 'warn';
  }
}

const contState = new ContainerState();
const busProxy = new OI4MessageBusProxy(contState);
const webProxy = new OI4WebProxy(contState);
const logger = new Logger(true, 'OI4-Base-Service', process.env.OI4_EDGE_EVENT_LEVEL as ESubResource, busProxy.mqttClient, busProxy.oi4Id, busProxy.serviceType);
logger.level = ESubResource.fatal;
logger.log(`Testprint for level ${ESubResource.trace}`, ESubResource.trace);
logger.log(`Testprint for level ${ESubResource.debug}`, ESubResource.debug);
logger.log(`Testprint for level ${ESubResource.info}`, ESubResource.info);
logger.log(`Testprint for level ${ESubResource.warn}`, ESubResource.warn);
logger.log(`Testprint for level ${ESubResource.error}`, ESubResource.error);
logger.log(`Testprint for level ${ESubResource.fatal}`, ESubResource.fatal);
logger.level = ESubResource.info;