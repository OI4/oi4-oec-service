import { matchersWithOptions } from 'jest-json-schema'
import schema from '../schemas/BaseDataType.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('BaseDataType schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid values', () => {
    expect(-Infinity).toMatchSchema(schema)
    expect(Infinity).toMatchSchema(schema)
    expect(null).toMatchSchema(schema)
    expect(true).toMatchSchema(schema)
    expect(false).toMatchSchema(schema)
    expect('').toMatchSchema(schema)
    expect('acme').toMatchSchema(schema)
    expect([{}]).toMatchSchema(schema)
    expect(['']).toMatchSchema(schema)
    expect([2]).toMatchSchema(schema)
    expect({}).toMatchSchema(schema)
    expect({ acme: 'mouse' }).toMatchSchema(schema)
    // TODO: likely these cases are not intended. To be clarified in OI4 work group
    expect([[[[[]]]]]).toMatchSchema(schema)
    expect([{ a: [[]] }, [[]], []]).toMatchSchema(schema)
  })
})
