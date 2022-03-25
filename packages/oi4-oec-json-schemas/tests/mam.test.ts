import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/mam.schema.json'
import LocalizedText from '../schemas/LocalizedText.schema.json'
import int32 from '../schemas/dataTypes/int32.schema.json'
import localeSchema from '../schemas/constants/locale.pattern.schema.json'

import validObjs from './__fixtures__/mam_valid.json'
import invalidObjs from './__fixtures__/mam_invalid.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [LocalizedText, int32],
    verbose: true,
  }, (ajv) => {
    ajv.addSchema(localeSchema)
  })
)

describe('mam schema', () => {
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
