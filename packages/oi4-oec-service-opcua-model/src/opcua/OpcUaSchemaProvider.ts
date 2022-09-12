import {
    byteSchemaJson,
    ConfigurationVersionDataTypeSchemaJson,
    DataSetMessageSchemaJson,
    int16SchemaJson,
    int32SchemaJson,
    int8SchemaJson,
    localePatternSchemaJson,
    LocalizedTextSchemaJson,
    NetworkMessageSchemaJson,
    oi4IdentifierSchemaJson,
    uint16SchemaJson,
    uint32SchemaJson
} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv';

export const buildOpcUaJsonValidator = () => {
    const jsonValidator = new Ajv();

    // OPC UA common Schemas
    jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');
    jsonValidator.addSchema(ConfigurationVersionDataTypeSchemaJson, 'ConfigurationVersionDataType.schema.json');
    jsonValidator.addSchema(oi4IdentifierSchemaJson, 'Oi4Identifier.schema.json');
    jsonValidator.addSchema(DataSetMessageSchemaJson, 'DataSetMessage.schema.json');
    jsonValidator.addSchema(LocalizedTextSchemaJson, 'LocalizedText.schema.json');

    // Constants
    jsonValidator.addSchema(localePatternSchemaJson, 'locale.pattern.schema.json');

    // Then dataTypes
    jsonValidator.addSchema(byteSchemaJson, 'byte.schema.json');
    jsonValidator.addSchema(int8SchemaJson, 'int8.schema.json');
    jsonValidator.addSchema(int16SchemaJson, 'int16.schema.json');
    jsonValidator.addSchema(int32SchemaJson, 'int32.schema.json');
    jsonValidator.addSchema(uint16SchemaJson, 'uint16.schema.json');
    jsonValidator.addSchema(uint32SchemaJson, 'uint32.schema.json');

    return jsonValidator;
}
