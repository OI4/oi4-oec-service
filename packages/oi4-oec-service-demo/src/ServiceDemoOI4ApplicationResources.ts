import {OI4ApplicationResources, DEFAULT_MAM_FILE} from '@oi4/oi4-oec-service-node';

const getMamFileLocation = (isLocal:boolean) => isLocal ? '../docker_configs/config/mam.json' : DEFAULT_MAM_FILE;

export class ServiceDemoOI4ApplicationResources extends OI4ApplicationResources {
    constructor(isLocal: boolean) {
        super(getMamFileLocation(isLocal));
    }
}
