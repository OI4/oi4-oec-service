import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';
import {Oi4Identifier} from '../Oi4Identifier';

export class ReferenceDesignation implements OI4Payload {

    readonly Function: ReferenceDesignationObject;
    readonly Product: ReferenceDesignationObject;
    readonly Location: ReferenceDesignationObject;

    constructor(functionObject: ReferenceDesignationObject, productObject: ReferenceDesignationObject, locationObject: ReferenceDesignationObject) {
        this.Function = functionObject;
        this.Product = productObject;
        this.Location = locationObject;
    }

    resourceType(): Resources {
        return Resources.REFERENCE_DESIGNATION;
    }

    static clone(source: ReferenceDesignation): ReferenceDesignation {
        return new ReferenceDesignation(source.Function, source.Product, source.Location);
    }
}

export interface ReferenceDesignationObject {
    Value: string;
    Local: string;
    Parent: ReferenceDesignationParent;
}

export interface ReferenceDesignationParent {
    Value: string;
    Local: string;
    Oi4Identifier: Oi4Identifier;
}
