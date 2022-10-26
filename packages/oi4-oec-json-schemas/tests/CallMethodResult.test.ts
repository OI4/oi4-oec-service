import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/CallMethodResult.schema.json'
import BaseDataType from '../src/schemas/BaseDataType.schema.json'
import uint32 from '../src/schemas/dataTypes/uint32.schema.json'

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
      StatusCode: 0,
      InputArgumentResults: [],
      OutputArguments: [],
    }).toMatchSchema(schema)
    expect({
      StatusCode: 4294967295,
      InputArgumentResults: [],
      OutputArguments: [],
    }).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    const invalidValues = [
      {},
      { InputArgumentResults: [], OutputArguments: [] },
      { StatusCode: 'a', InputArgumentResults: [], OutputArguments: [] },
      { StatusCode: -1, InputArgumentResults: [], OutputArguments: [] },
      { StatusCode: 4294967296, InputArgumentResults: [], OutputArguments: [] },
    ]

    invalidValues.forEach((value, index) => {
      expect(value).not.toMatchSchema(schema)
      expect(() => {
        expect(value).toMatchSchema(schema)
      }).toThrowErrorMatchingSnapshot(index.toString())
    })
  })
})
