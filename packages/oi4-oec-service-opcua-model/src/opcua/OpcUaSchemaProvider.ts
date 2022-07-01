// // Base
import {oi4IdentifierSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {NetworkMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {ConfigurationVersionDataTypeSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {DataSetMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {LocalizedTextSchemaJson} from '@oi4/oi4-oec-json-schemas';

// Constants
import {localePatternSchemaJson} from '@oi4/oi4-oec-json-schemas'

// DataTypes
import {byteSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {int8SchemaJson} from '@oi4/oi4-oec-json-schemas';
import {int16SchemaJson} from '@oi4/oi4-oec-json-schemas';
import {int32SchemaJson} from '@oi4/oi4-oec-json-schemas';
import {uint16SchemaJson} from '@oi4/oi4-oec-json-schemas';
import {uint32SchemaJson} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv';

export const buildOpcUaJsonValidator = () => {
    const jsonValidator = new Ajv();

    // OPC UA common Schemas
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
