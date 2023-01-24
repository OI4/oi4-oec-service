import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/PublicationList.schema.json'
import uint16 from '../src/schemas/dataTypes/uint16.schema.json'
import uint32 from '../src/schemas/dataTypes/uint32.schema.json'
import resources from '../src/schemas/constants/resources.schema.json'
import oi4Identifier from '../src/schemas/Oi4Identifier.schema.json'

import validObjs from './__fixtures__/publicationList_valid.json'
import invalidObjs from './__fixtures__/publicationList_invalid.json'

expect.extend(
    matchersWithOptions({
      // Loading in a schema which is composed only of definitions,
      // which means specific test schemas need to be created.
      // This is good for testing specific conditions for definition schemas.
      schemas: [uint16, uint32, resources, oi4Identifier],
      verbose: true,
    })
  )
describe('publicationList schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it.each(validObjs as [])(
    '(%#) match valid publicationList object to schema -> %s',
    (_name: string, obj) => {
      expect(obj).toMatchSchema(schema)
    }
  )

  it.each(invalidObjs as [])(
    '(%#) match fails for invalid publicationList -> %s',
    (name: string, obj) => {
      expect(obj).not.toMatchSchema(schema)
      expect(() => {
        expect(obj).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(name)
    }
  )
})
