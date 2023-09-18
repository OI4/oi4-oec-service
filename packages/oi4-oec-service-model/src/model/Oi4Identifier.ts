import {dnpEncode, dnpDecode} from '@oi4/oi4-oec-dnp-encoding';

export class Oi4Identifier {
    manufacturerUri: string;
    model: string;
    productCode: string;
    serialNumber: string;

    constructor(manufacturerUri: string, model: string, productCode: string, serialNumber: string, decodeArguments = false) {
        this.manufacturerUri = manufacturerUri;
        this.model = decodeArguments ? dnpDecode(model) : model;
        this.productCode = decodeArguments ? dnpDecode(productCode) : productCode;
        this.serialNumber = decodeArguments ? dnpDecode(serialNumber) : serialNumber;
    }

    toString(): string {
        return `${dnpEncode(this.manufacturerUri)}/${dnpEncode(this.model)}/${dnpEncode(this.productCode)}/${dnpEncode(this.serialNumber)}`;
    }

    static fromString(oi4Id: string, isEncoded = true): Oi4Identifier {
        if (oi4Id === undefined) {
            throw new Error('No OI4 identifier provided');
        }
        const oi4IdParts = oi4Id.split('/');
        if (oi4IdParts.length !== 4) {
            throw new Error(`Invalid OI4 identifier: ${oi4Id}`);
        }
        const getPart = (pos: number) => isEncoded ? dnpDecode(oi4IdParts[pos]) : oi4IdParts[pos];

        return new Oi4Identifier(getPart(0), getPart(1), getPart(2), getPart(3), true);
    }

    static fromDNPString(oi4Id: string): Oi4Identifier {
        return this.fromString(dnpDecode(oi4Id));
    }

    equals(other: Oi4Identifier): boolean {
        return other !== undefined && //
            this.manufacturerUri === other.manufacturerUri && //
            this.model === other.model && //
            this.productCode === other.productCode && //
            this.serialNumber === other.serialNumber;
    }
}
