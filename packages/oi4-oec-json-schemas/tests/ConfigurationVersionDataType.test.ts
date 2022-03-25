import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/ConfigurationVersionDataType.schema.json'
import uint32 from '../schemas/dataTypes/uint32.schema.json'

import validObjs from './__fixtures__/ConfigurationVersionDataType_valid.json'
import invalidObjs from './__fixtures__/ConfigurationVersionDataType_invalid.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [uint32],
    verbose: true,
  })
)

describe('ConfigurationVersionDataType schema', () => {
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
