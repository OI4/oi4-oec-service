import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/dataTypes/int8.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('int8 schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect(-128).toMatchSchema(schema)
    expect(-127).toMatchSchema(schema)
    expect(-1).toMatchSchema(schema)
    expect(0).toMatchSchema(schema)
    expect(1).toMatchSchema(schema)
    expect(1.0).toMatchSchema(schema)
    expect(126).toMatchSchema(schema)
    expect(127).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    expect(-129).not.toMatchSchema(schema)
    expect(-1.5).not.toMatchSchema(schema)
    expect(128).not.toMatchSchema(schema)

    expect(() => {
      expect(-129).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-129')
    expect(() => {
      expect(-1.5).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-1.5')
    expect(() => {
      expect(128).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('128')
  })
})
