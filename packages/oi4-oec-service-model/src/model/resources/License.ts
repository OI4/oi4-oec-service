import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

/**
 * License resource for software component licensing information.
 * @deprecated ADR 002: Use SBOM files (SPDX or CycloneDX) at /opt/oi4/licenses instead.
 * This resource will be removed in a future version.
 */
export class License implements OI4Payload {
    readonly LicenseId: string;
    readonly Components: IComponentObject[];

    constructor(licenseId: string, components: IComponentObject[]) {
        this.LicenseId = licenseId;
        this.Components = components;
    }

    resourceType(): Resources {
        return Resources.LICENSE;
    }

    static clone(source: License): License {
        return new License(source.LicenseId, source.Components);
    }

}

export interface IComponentObject {
    Component: string;
    LicAuthors: string[];
    LicAddText: string;
}
