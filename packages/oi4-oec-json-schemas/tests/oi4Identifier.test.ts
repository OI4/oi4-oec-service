import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/oi4Identifier.schema.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [schema],
    verbose: true,
  })
)

describe('oi4Identifier schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })
})
