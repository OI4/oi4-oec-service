import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/dataTypes/uint16.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('uint16 schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect(0).toMatchSchema(schema)
    expect(1).toMatchSchema(schema)
    expect(1.0).toMatchSchema(schema)
    expect(65534).toMatchSchema(schema)
    expect(65535).toMatchSchema(schema)
  })

  it('test invalid values', () => {
    expect(-1).not.toMatchSchema(schema)
    expect(1.5).not.toMatchSchema(schema)
    expect(65536).not.toMatchSchema(schema)

    expect(() => {
      expect(-1).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-1')
    expect(() => {
      expect(1.5).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('1.5')
    expect(() => {
      expect(65536).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('65536')
  })
})
