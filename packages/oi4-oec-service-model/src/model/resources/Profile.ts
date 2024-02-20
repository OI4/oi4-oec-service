import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

export class Profile implements OI4Payload {
    readonly Resources: Resources[];

    constructor(resources: Resources[]) {
        this.Resources = Object.assign([], resources);
    }

    resourceType(): Resources {
        return Resources.PROFILE;
    }

    static clone(source: Profile): Profile {
        return new Profile(source.Resources);
    }
}
