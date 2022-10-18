import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/health.schema.json'
import deviceHealthEnumerationSchema from '../src/schemas/constants/DeviceHealthEnumeration.schema.json'

import validHealthObjs from './__fixtures__/healths_valid.json'
import invalidHealthObjs from './__fixtures__/healths_invalid.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  }, (ajv) => {
    ajv.addSchema(deviceHealthEnumerationSchema)
  })
)

describe('health schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it.each(validHealthObjs as [])(
    '(%#) match valid config object to schema -> %s',
    (_name: string, obj) => {
      expect(obj).toMatchSchema(schema)
    }
  )

  it.each(invalidHealthObjs)(
    '(%#) match fails for invalid config -> %s',
    (name: string, obj) => {
      expect(obj).not.toMatchSchema(schema)
      expect(() => {
        expect(obj).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(name)
    }
  )
})
