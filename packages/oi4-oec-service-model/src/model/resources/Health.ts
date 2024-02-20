import {OI4Payload} from '../Payload';
import {EDeviceHealth} from '../EContainer';
import {Resources} from '../Resources';

export class Health implements OI4Payload {
    readonly Health: EDeviceHealth;
    readonly HealthScore: number; // UInt16 (from 0 to 100%)

    constructor(health: EDeviceHealth, healthScore: number) {
        this.Health = health;
        this.HealthScore = healthScore;
    }

    resourceType(): Resources {
        return Resources.HEALTH;
    }

    static clone(source: Health): Health {
        return new Health(source.Health, source.HealthScore);
    }
}
