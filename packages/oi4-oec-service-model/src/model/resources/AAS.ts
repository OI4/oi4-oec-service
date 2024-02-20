import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

export class AAS implements OI4Payload {
    readonly AASId: string;
    readonly GlobalAssetId: string;

    constructor(id: string, gId: string) {
        this.AASId = id;
        this.GlobalAssetId = gId;
    }

    resourceType(): Resources {
        return Resources.AAS;
    }

    static clone(source: AAS): AAS {
        return new AAS(source.AASId, source.GlobalAssetId);
    }

}
