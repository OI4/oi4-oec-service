import schema from '../src/schemas/AAS.schema.json'

import validAASObjs from './__fixtures__/aas_valid.json'
import invalidAASObjs from './__fixtures__/aas_invalid.json'
import int32 from '../src/schemas/dataTypes/int32.schema.json'
import {matchersWithOptions} from 'jest-json-schema';

expect.extend(
    matchersWithOptions({
        verbose: true,
    }, (ajv) => {
        ajv.addSchema(int32)
    })
)

describe('aas schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it.each(validAASObjs as [])(
    '(%#) match valid config object to schema -> %s',
    (_name: string, obj) => {
      expect(obj).toMatchSchema(schema)
    }
  )

  it.each(invalidAASObjs)(
    '(%#) match fails for invalid config -> %s',
    (name: string, obj) => {
      expect(obj).not.toMatchSchema(schema)
      expect(() => {
        expect(obj).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(name)
    }
  )
})
