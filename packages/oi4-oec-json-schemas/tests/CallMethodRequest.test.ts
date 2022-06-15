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
    expect({ methodId: 'a', inputArguments: [''] }).toMatchSchema(schema)
    expect({ methodId: '1', inputArguments: [1] }).toMatchSchema(schema)
    expect({ methodId: 'a', inputArguments: [true] }).toMatchSchema(schema)
    expect({ methodId: 'b', inputArguments: [{}] }).toMatchSchema(schema)
    expect({ methodId: 'c', inputArguments: [{ a: 'b', b: 1 }] }).toMatchSchema(
      schema
    )
    expect({ methodId: 'c', inputArguments: [[]] }).toMatchSchema(schema)
    expect({ methodId: 'c', inputArguments: [[1]] }).toMatchSchema(schema)
    expect({ methodId: 'c', inputArguments: [['']] }).toMatchSchema(schema)
    expect({ methodId: 'c', inputArguments: [[{}]] }).toMatchSchema(schema)
    expect({
      methodId: 'c',
      inputArguments: [[{ a: 'b', b: 1 }]],
    }).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    const invalidValues = [
      {},
      { methodId: 'a' },
      { inputArguments: '' },
      { methodId: '', inputArguments: [] },
      { methodId: 1, namespaceIndex: 1 },
    ]

    invalidValues.forEach((value, index) => {
      expect(value).not.toMatchSchema(schema)
      expect(() => {
        expect(value).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(index.toString())
    })
  })
})
