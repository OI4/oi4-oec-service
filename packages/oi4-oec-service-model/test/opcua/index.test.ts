import {Oi4Identifier, OPCUABuilder, ServiceTypes} from '../../src';
import {NetworkMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from '../__fixtures__/mam_network_message.json';
import invalidMam from '../__fixtures__/invalid_mam_network_message.json';

describe('Unit test for MAMStorage reading', () => {

    const oi4Identifier = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');

    it('checks OPC UA JSON validity', async () => {
        const builder = new OPCUABuilder(oi4Identifier, ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(mam).then(result => {
            expect(result).toBe(true);
        });
    });

    it('should fail on invalid network message', () => {
        const builder = new OPCUABuilder(oi4Identifier, ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(invalidMam).then(result => {
            expect(result).toBe(false);
        });
    });

    it('should fail on on json schema validation problem', async () => {
        const jsonValidator = new Ajv();
        jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');

        const builder = new OPCUABuilder(oi4Identifier, ServiceTypes.AGGREGATION, 262144, jsonValidator);

        expect.assertions(1);
        try {
            await builder.checkOPCUAJSONValidity(mam);
        } catch (error) {
            expect(error).toBe('Validation failed with: can\'t resolve reference DataSetMessage.schema.json from id NetworkMessage.schema.json#');
        }
    });
});
