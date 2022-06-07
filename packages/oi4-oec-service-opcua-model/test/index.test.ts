import {NetworkMessageBaseSchemaJson, NetworkMessageSchemaJson, OPCUABuilder} from '../src';
import Ajv from 'ajv'; /*tslint:disable-line*/
const mam = require('./__fixtures__/mam_network_message.json');
const invalidMam = require('./__fixtures__/invalid_mam_network_message.json');

test('checks OPC UA JSON validity', () => {
    const builder = new OPCUABuilder('', '');
    return builder.checkOPCUAJSONValidity(mam).then(result => {
        expect(result).toBe(true);
    });
});

test('should fail on invalid network message', () => {
    const builder = new OPCUABuilder('', '');
    return builder.checkOPCUAJSONValidity(invalidMam).then(result => {
        expect(result).toBe(false);
    });
});

test('should fail on on json schema validation problem', async () => {
    const jsonValidator = new Ajv();
    jsonValidator.addSchema(NetworkMessageBaseSchemaJson, 'NetworkMessageBase.schema.json');
    jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');

    const builder = new OPCUABuilder('', '', jsonValidator);

    expect.assertions(1);
    try {
        await builder.checkOPCUAJSONValidity(mam);
    } catch (error) {
        expect(error).toBe('Validation failed with: can\'t resolve reference DataSetMessage.schema.json from id NetworkMessage.schema.json#');
    }
});