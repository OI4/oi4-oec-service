import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/LocalizedText.schema.json'
import localeSchema from '../schemas/constants/locale.pattern.schema.json'

import validObjs from './__fixtures__/LocalizedText_valid.json'
import invalidObjs from './__fixtures__/LocalizedText_invalid.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  }, (ajv) => {
    ajv.addSchema(localeSchema)
  })
)

describe('LocalizedText schema', () => {
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
