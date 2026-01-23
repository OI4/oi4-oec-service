import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

/**
 * LicenseText resource containing full license text content.
 * @deprecated ADR 002: Use SBOM files (SPDX or CycloneDX) at /opt/oi4/licenses instead.
 * This resource will be removed in a future version.
 */
export class LicenseText implements OI4Payload {
    readonly LicenseText: string;

    constructor(licenseText: string) {
        this.LicenseText = licenseText;
    }

    resourceType(): Resources {
        return Resources.LICENSE_TEXT;
    }

    static clone(source: LicenseText): LicenseText {
        return new LicenseText(source.LicenseText);
    }
}
