import {IOI4ApplicationResources} from '@oi4/oi4-oec-service-model';
import {OI4ApplicationResources} from '@oi4/oi4-oec-service-node';
import path from 'node:path';

export const testMAMFile = path.join(__dirname, '../../__fixtures__/mam.json');

export class MockOI4ApplicationResources extends OI4ApplicationResources implements IOI4ApplicationResources {

    constructor(mamFile = testMAMFile) {
        process.env.IS_LOCAL = 'true';
        super(mamFile);
    }

}
