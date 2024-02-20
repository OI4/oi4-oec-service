import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

export class RTLicense implements OI4Payload {
    resourceType(): Resources {
        return Resources.RT_LICENSE;
    }
}
