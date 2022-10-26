import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/CallMethodRequest.schema.json'
import BaseDataType from '../src/schemas/BaseDataType.schema.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [BaseDataType],
    verbose: true,
  })
)

describe('CallMethodRequest schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect({ MethodId: 'a', InputArguments: [''] }).toMatchSchema(schema)
    expect({ MethodId: '1', InputArguments: [1] }).toMatchSchema(schema)
    expect({ MethodId: 'a', InputArguments: [true] }).toMatchSchema(schema)
    expect({ MethodId: 'b', InputArguments: [{}] }).toMatchSchema(schema)
    expect({ MethodId: 'c', InputArguments: [{ a: 'b', b: 1 }] }).toMatchSchema(
      schema
    )
    expect({ MethodId: 'c', InputArguments: [[]] }).toMatchSchema(schema)
    expect({ MethodId: 'c', InputArguments: [[1]] }).toMatchSchema(schema)
    expect({ MethodId: 'c', InputArguments: [['']] }).toMatchSchema(schema)
    expect({ MethodId: 'c', InputArguments: [[{}]] }).toMatchSchema(schema)
    expect({
      MethodId: 'c',
      InputArguments: [[{ a: 'b', b: 1 }]],
    }).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    const invalidValues = [
      {},
      { MethodId: 'a' },
      { InputArguments: '' },
      { MethodId: '', InputArguments: [] },
      { MethodId: 1, NamespaceIndex: 1 },
    ]

    invalidValues.forEach((value, index) => {
      expect(value).not.toMatchSchema(schema)
      expect(() => {
        expect(value).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(index.toString())
    })
  })
})
