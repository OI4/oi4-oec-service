import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/dataTypes/int32.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('int32 schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect(-2147483648).toMatchSchema(schema)
    expect(-2147483647).toMatchSchema(schema)
    expect(-1).toMatchSchema(schema)
    expect(0).toMatchSchema(schema)
    expect(1).toMatchSchema(schema)
    expect(1.0).toMatchSchema(schema)
    expect(2147483646).toMatchSchema(schema)
    expect(2147483647).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    expect(-2147483649).not.toMatchSchema(schema)
    expect(-1.5).not.toMatchSchema(schema)
    expect(2147483648).not.toMatchSchema(schema)

    expect(() => {
      expect(-2147483649).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-2147483649')
    expect(() => {
      expect(1.5).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('1.5')
    expect(() => {
      expect(2147483648).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('2147483648')
  })
})
