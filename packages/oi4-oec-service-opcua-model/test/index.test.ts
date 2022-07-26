import {OPCUABuilder} from '../src';
import {NetworkMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from './__fixtures__/mam_network_message.json';
import invalidMam from './__fixtures__/invalid_mam_network_message.json';
import {ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for MAMStorage reading', () => {

    it('checks OPC UA JSON validity', async () => {
        const builder = new OPCUABuilder('', ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(mam).then(result => {
            expect(result).toBe(true);
        });
    });

    it('should fail on invalid network message', () => {
        const builder = new OPCUABuilder('', ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(invalidMam).then(result => {
            expect(result).toBe(false);
        });
    });

    it('should fail on on json schema validation problem', async () => {
        const jsonValidator = new Ajv();
        jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');

        const builder = new OPCUABuilder('', ServiceTypes.AGGREGATION, jsonValidator);

        expect.assertions(1);
        try {
            await builder.checkOPCUAJSONValidity(mam);
        } catch (error) {
            expect(error).toBe('Validation failed with: can\'t resolve reference DataSetMessage.schema.json from id NetworkMessage.schema.json#');
        }
    });
});
