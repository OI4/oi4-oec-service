import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/ServiceNetworkMessage.schema.json'
import serviceParameterRequest from '../src/schemas/ServiceParametersRequest.schema.json'
import serviceParameterResponse from '../src/schemas/ServiceParametersResponse.schema.json'
import callMethodRequest from '../src/schemas/CallMethodRequest.schema.json'
import callMethodResult from '../src/schemas/CallMethodResult.schema.json'
import baseDataType from '../src/schemas/BaseDataType.schema.json'
import uint32 from '../src/schemas/dataTypes/uint32.schema.json'

import validObjs from './__fixtures__/ServiceNetworkMessage_valid.json'
import invalidObjs from './__fixtures__/ServiceNetworkMessage_invalid.json'


expect.extend(
  matchersWithOptions({
    // Loading in a schema which is comprised only of definitions,
    // which means specific test schemas need to be created.
    // This is good for testing specific conditions for definition schemas.
    schemas: [serviceParameterRequest, serviceParameterResponse,
    callMethodRequest, callMethodResult, baseDataType, uint32],
    verbose: true,
  })
)

describe('ServiceNetworkMessage schema', () => {
    it('validate schema', () => {
      expect(schema).toBeValidSchema()
    })
  
    it.each(validObjs as [])(
      '(%#) match valid config object to schema -> %s',
      (_name: string, obj) => {
        expect(obj).toMatchSchema(schema)
      }
    )
  
    it.each(invalidObjs as [])(
      '(%#) match fails for invalid config -> %s',
      (name: string, obj) => {
        expect(obj).not.toMatchSchema(schema)
        expect(() => {
          expect(obj).toMatchSchema(schema)
        }).toThrowErrorMatchingSnapshot(name)
      }
    )
  })