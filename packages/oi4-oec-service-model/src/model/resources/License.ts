import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

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
