import {ContainerState} from '@oi4/oi4-oec-service-node';
import {OI4MessageBusProxy} from '@oi4/oi4-oec-service-node';

const containerState = new ContainerState();
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const oi4MessageBus = new OI4MessageBusProxy(containerState, {
    host: '172.17.0.4',
    port: 8883,
    keepalive: 60,
    reconnectPeriod: 1000,
    protocol: 'mqtts',
});
console.log('===========FINISHED============');
