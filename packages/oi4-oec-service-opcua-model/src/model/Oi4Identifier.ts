export class Oi4Identifier {
    manufacturerUri: string;
    model: string;
    productCode: string;
    serialNumber: string;

    constructor(manufacturerUri: string, model: string, productCode: string, serialNumber: string) {
        this.manufacturerUri = manufacturerUri;
        this.model = model;
        this.productCode = productCode;
        this.serialNumber = serialNumber;
    }

    toString(): string {
        return `${this.manufacturerUri}/${this.model}/${this.productCode}/${this.serialNumber}`;
    }

    static fromString(oi4Id: string = ''): Oi4Identifier {
        const oi4IdParts = oi4Id.split('/');
        if (oi4IdParts.length !== 4) {
            throw new Error(`Invalid OI4 identifier: ${oi4Id}`);
        }
        return new Oi4Identifier(oi4IdParts[0], oi4IdParts[1], oi4IdParts[2], oi4IdParts[3]);
    }

    equals(other: Oi4Identifier): boolean {
        return other !== undefined && //
            this.manufacturerUri === other.manufacturerUri && //
            this.model === other.model && //
            this.productCode === other.productCode && //
            this.serialNumber === other.serialNumber;
    }
}
