import {matchersWithOptions} from 'jest-json-schema'
import schema from '../src/schemas/QualifiedName.schema.json'
import uint16 from '../src/schemas/dataTypes/uint16.schema.json'

expect.extend(
    matchersWithOptions({
        // Loading in a schema which is only comprised of definitions,
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
        expect({Name: '', NamespaceIndex: 0}).toMatchSchema(schema)
        expect({Name: '1', NamespaceIndex: 0}).toMatchSchema(schema)
        expect({Name: 'a', NamespaceIndex: 0}).toMatchSchema(schema)
        expect({Name: 'b', NamespaceIndex: 65534}).toMatchSchema(schema)
        expect({Name: 'c', NamespaceIndex: 65535}).toMatchSchema(schema)
    })

    it('test invalid values', () => {
        const invalidValues = [
            {Name: 1, NamespaceIndex: 1},
            {Name: 'b', NamespaceIndex: 65536},
            {Name: 'c', NamespaceIndex: -1},
            {Name: 'c', NamespaceIndex: '1'},
        ]

        invalidValues.forEach((value, index) => {
            expect(value).not.toMatchSchema(schema)
            expect(() => {
                expect(value).toMatchSchema(schema)
            }).toThrowErrorMatchingSnapshot(index.toString())
        })
    })
})
