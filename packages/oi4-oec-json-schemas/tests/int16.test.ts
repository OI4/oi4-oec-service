import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/dataTypes/int16.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('int16 schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect(-32768).toMatchSchema(schema)
    expect(-32767).toMatchSchema(schema)
    expect(-1).toMatchSchema(schema)
    expect(0).toMatchSchema(schema)
    expect(1).toMatchSchema(schema)
    expect(1.0).toMatchSchema(schema)
    expect(32766).toMatchSchema(schema)
    expect(32767).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    expect(-32769).not.toMatchSchema(schema)
    expect(1.5).not.toMatchSchema(schema)
    expect(32768).not.toMatchSchema(schema)
    expect(() => {
      expect(-32769).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-32769')
    expect(() => {
      expect(1.5).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('1.5')
    expect(() => {
      expect(32768).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('32768')
  })
})
