import {IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {OI4ApplicationResources} from '@oi4/oi4-oec-service-node';

export const testMAMFile = './tests/__fixtures__/mam.json';
export class MockOI4ApplicationResources extends OI4ApplicationResources implements IOI4ApplicationResources {

    constructor(mamFile = testMAMFile) {
        super(mamFile);
    }
}
