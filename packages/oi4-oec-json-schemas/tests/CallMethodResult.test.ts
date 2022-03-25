import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/CallMethodResult.schema.json'
import BaseDataType from '../schemas/BaseDataType.schema.json'
import uint32 from '../schemas/dataTypes/uint32.schema.json'

expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [BaseDataType, uint32],
    verbose: true,
  })
)

describe('CallMethodResult schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect({
      statusCode: 0,
      inputArgumentResults: [],
      outputArguments: [],
    }).toMatchSchema(schema)
    expect({
      statusCode: 4294967295,
      inputArgumentResults: [],
      outputArguments: [],
    }).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    const invalidValues = [
      {},
      { inputArgumentResults: [], outputArguments: [] },
      { statusCode: 'a', inputArgumentResults: [], outputArguments: [] },
      { statusCode: -1, inputArgumentResults: [], outputArguments: [] },
      { statusCode: 4294967296, inputArgumentResults: [], outputArguments: [] },
    ]

    invalidValues.forEach((value, index) => {
      expect(value).not.toMatchSchema(schema)
      expect(() => {
        expect(value).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(index.toString())
    })
  })
})
