import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/DataSetMetaData.schema.json'
import uint16 from '../src/schemas/dataTypes/uint16.schema.json'
import uint32 from '../src/schemas/dataTypes/uint32.schema.json'
import int32 from '../src/schemas/dataTypes/int32.schema.json'
import byte from '../src/schemas/dataTypes/byte.schema.json'
import keyValuePair from '../src/schemas/KeyValuePair.schema.json'
import baseDataType from '../src/schemas/BaseDataType.schema.json'
import enumDescription from '../src/schemas/EnumDescription.schema.json'
import qualifiedName from '../src/schemas/QualifiedName.schema.json'
import localizedTextSchema from '../src/schemas/LocalizedText.schema.json'
import locale from '../src/schemas/constants/locale.pattern.schema.json'
import dataSetMetaDataTypeSchema from '../src/schemas/DataSetMetaDataType.schema.json'
import configurationVersionDataTypeSchema from '../src/schemas/ConfigurationVersionDataType.schema.json'
import fieldMetaDataSchema from '../src/schemas/FieldMetaData.schema.json'
import nodeIdSchema from '../src/schemas/NodeId.schema.json'
import structureDescription from '../src/schemas/StructureDescription.schema.json'
import simpleTypeDescription from '../src/schemas/SimpleTypeDescription.schema.json'
import oi4Identifier from '../src/schemas/oi4Identifier.schema.json'

import validObjs from './__fixtures__/DataSetMetaData_valid.json'
import invalidObjs from './__fixtures__/DataSetMetaData_invalid.json'


expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [uint16, uint32, int32, byte, localizedTextSchema, locale, 
      keyValuePair, qualifiedName, baseDataType, enumDescription, structureDescription,
    simpleTypeDescription, oi4Identifier],
    verbose: true,
  }, (ajv) => {
    ajv.addSchema(dataSetMetaDataTypeSchema);
    ajv.addSchema(configurationVersionDataTypeSchema);
    ajv.addSchema(fieldMetaDataSchema);
    ajv.addSchema(nodeIdSchema);
  })
)

describe('DataSetMetaData schema', () => {
    it('validate schema', () => {
      expect(schema).toBeValidSchema()
    })
  
    it.each(validObjs as [])(
      '(%#) match valid config object to schema -> %s',
      (_name: string, obj) => {
        expect(obj).toMatchSchema(schema)
      }
    )
  
    it.each(invalidObjs as [])(
      '(%#) match fails for invalid config -> %s',
      (name: string, obj) => {
        expect(obj).not.toMatchSchema(schema)
        expect(() => {
          expect(obj).toMatchSchema(schema)
        }).toThrowErrorMatchingSnapshot(name)
      }
    )
  })