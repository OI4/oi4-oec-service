import {OI4ApplicationResources, OI4ApplicationFactory} from '@oi4/oi4-oec-service-node';

const applicationFactory = new OI4ApplicationFactory(new OI4ApplicationResources());
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const oi4MessageBus = applicationFactory.createOI4Application();
console.log('|===========FINISHED============|');
