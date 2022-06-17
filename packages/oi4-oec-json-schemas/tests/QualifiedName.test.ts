import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/QualifiedName.schema.json'
import uint16 from '../src/schemas/dataTypes/uint16.schema.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [uint16],
    verbose: true,
  })
)

describe('QualifiedName schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect({ name: '', namespaceIndex: 0 }).toMatchSchema(schema)
    expect({ name: '1', namespaceIndex: 0 }).toMatchSchema(schema)
    expect({ name: 'a', namespaceIndex: 0 }).toMatchSchema(schema)
    expect({ name: 'b', namespaceIndex: 65534 }).toMatchSchema(schema)
    expect({ name: 'c', namespaceIndex: 65535 }).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    const invalidValues = [
      { name: 1, namespaceIndex: 1 },
      { name: 'b', namespaceIndex: 65536 },
      { name: 'c', namespaceIndex: -1 },
      { name: 'c', namespaceIndex: '1' },
    ]

    invalidValues.forEach((value, index) => {
      expect(value).not.toMatchSchema(schema)
      expect(() => {
        expect(value).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(index.toString())
    })
  })
})
