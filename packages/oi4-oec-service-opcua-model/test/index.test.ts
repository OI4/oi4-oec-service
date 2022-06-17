import {OPCUABuilder} from '../src';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {NetworkMessageBaseSchemaJson, NetworkMessageSchemaJson} from '../../oi4-oec-json-schemas/src/index';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from './__fixtures__/mam_network_message.json';
import invalidMam from './__fixtures__/invalid_mam_network_message.json';

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
