import { matchersWithOptions } from 'jest-json-schema'
import configSchema from '../schemas/configPublish.schema.json'
import localizationSchema from '../schemas/LocalizedText.schema.json'
import localeSchema from '../schemas/constants/locale.pattern.schema.json'

import validConfigObjs from './__fixtures__/configs_valid.json'
import invalidConfigObjs from './__fixtures__/configs_invalid.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [localizationSchema],
    verbose: true,
  }, (ajv) => {
    ajv.addSchema(localeSchema)
  })
)

describe('config schema', () => {
  it('validate schema', () => {
    expect(configSchema).toBeValidSchema()
    expect(localizationSchema).toBeValidSchema()
  })

  it.each(validConfigObjs as [])(
    '(%#) match valid config object to schema -> %s',
    (_name: string, conf) => {
      expect(conf).toMatchSchema(configSchema)
    }
  )

  it.each(invalidConfigObjs)(
    '(%#) match fails for invalid config -> %s',
    (name: string, conf) => {
      expect(conf).not.toMatchSchema(configSchema)
      expect(() => {
        expect(conf).toMatchSchema(configSchema)
      }).toThrowErrorMatchingSnapshot(name)
    }
  )
})