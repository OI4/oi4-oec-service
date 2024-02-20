import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

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
