// Base
import oi4IdentifierSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/oi4Identifier.schema.json';
import NetworkMessageBaseSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/NetworkMessageBase.schema.json';
import NetworkMessageSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/NetworkMessage.schema.json';
import ConfigurationVersionDataTypeSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/ConfigurationVersionDataType.schema.json';
import DataSetMessageSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/DataSetMessage.schema.json';
import LocalizedTextSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/LocalizedText.schema.json';

// Constants
import localePatternSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/constants/locale.pattern.schema.json'

// DataTypes
import byteSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/byte.schema.json';
import int8SchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/int8.schema.json';
import int16SchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/int16.schema.json';
import int32SchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/int32.schema.json';
import uint16SchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/uint16.schema.json';
import uint32SchemaJson from '@oi4/oi4-oec-json-schemas/schemas/dataTypes/uint32.schema.json';
import Ajv from "ajv";

export {
    // Base
    NetworkMessageBaseSchemaJson,
    NetworkMessageSchemaJson,
    ConfigurationVersionDataTypeSchemaJson,
    DataSetMessageSchemaJson,
    // Constants
    LocalizedTextSchemaJson,
    localePatternSchemaJson,
    //DataTypes
    byteSchemaJson,
    int8SchemaJson,
    int16SchemaJson,
    int32SchemaJson,
    uint16SchemaJson,
    uint32SchemaJson,
}

/**
 * Builder method to create an Ajv based JSon Schema validator for OPC UA JSon messages
 */
export const buildOpcUaJsonValidator = () => {
    const jsonValidator = new Ajv();

    // OPC UA common Schemas
    jsonValidator.addSchema(NetworkMessageBaseSchemaJson, 'NetworkMessageBase.schema.json');
    jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');
    jsonValidator.addSchema(ConfigurationVersionDataTypeSchemaJson, 'ConfigurationVersionDataType.schema.json');
    jsonValidator.addSchema(oi4IdentifierSchemaJson, 'oi4Identifier.schema.json');
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
