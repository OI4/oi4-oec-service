import {OI4Payload} from '../Payload';
import {EDeviceHealth} from '../EContainer';
import {Resources} from '../Resources';

/**
 * Detail object containing subordinate health status information,
 * supporting multiple overlapping health statuses.
 */
export interface HealthDetailObject {
    /** Health status as defined by NAMUR NE107 (mandatory) */
    Health: EDeviceHealth;
    /** Manufacturer specific diagnostic code, e.g., "F-238" (optional) */
    DiagnosticCode?: string;
    /** Location within the asset/service where the health event occurred (optional) */
    Location?: string;
    /** Additional description of the health status (optional) */
    Description?: {
        Locale: string;
        Text: string;
    };
}

/**
 * Health message structure supports multiple subordinate health statuses via the Details array.
 */
export class Health implements OI4Payload {
    /** Most severe health status as defined by NAMUR NE107 */
    readonly Health: EDeviceHealth;
    /** Current health level as a percentage (0-100%) */
    readonly HealthScore?: number;
    /** List of subordinate health statuses (optional, ADR 001) */
    readonly Details?: HealthDetailObject[];

    constructor(
        health: EDeviceHealth,
        healthScore?: number,
        details?: HealthDetailObject[]
    ) {
        this.Health = health;
        this.HealthScore = healthScore;
        this.Details = details;
    }

    resourceType(): Resources {
        return Resources.HEALTH;
    }

    static clone(source: Health): Health {
        const clonedDetails = source.Details?.map(detail => ({...detail}));
        return new Health(source.Health, source.HealthScore, clonedDetails);
    }
}
