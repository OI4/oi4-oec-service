import avro from 'avsc';

export class AvroManager {
    private avroType: avro.Type = undefined;
    constructor(avroSchema: string) {
        this.avroType = avro.Type.forSchema(avroSchema);
    }
    serializeData<T>(data: T): Buffer {
        return this.avroType.toBuffer(data);
    }

    deserializeAvroData<T>(avroData: Buffer): T {
        return this.avroType.fromBuffer(avroData);
    }

    isValidData<T>(data: T): boolean {
        return this.avroType.isValid(data);
    }

    setAvroSchema(avroSchema: string): void {
        this.avroType = avro.Type.forSchema(avroSchema);
    }

    isSchemaRegistered(): boolean {
        return this.avroType !== undefined;
    }
}
