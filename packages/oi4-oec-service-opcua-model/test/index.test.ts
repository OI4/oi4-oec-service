import {OPCUABuilder} from '../src';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {NetworkMessageSchemaJson} from '../../oi4-oec-json-schemas/src/index';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from './__fixtures__/mam_network_message.json';
import invalidMam from './__fixtures__/invalid_mam_network_message.json';
import {DataSetClassIds, ServiceTypes} from '@oi4/oi4-oec-service-model';

function createOPCUABuilderWithLastMessageId(prefix: string): OPCUABuilder {
    const pubId = 'pubId';
    const builder = new OPCUABuilder('oi4id',ServiceTypes.REGISTRY,undefined);
    builder.lastMessageId = `${prefix}-${pubId}`;
    builder.publisherId = pubId;
    return builder;
}

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
    jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');

    const builder = new OPCUABuilder('', '', jsonValidator);

    expect.assertions(1);
    try {
        await builder.checkOPCUAJSONValidity(mam);
    } catch (error) {
        expect(error).toBe('Validation failed with: can\'t resolve reference DataSetMessage.schema.json from id NetworkMessage.schema.json#');
    }
});

test('should increase over flow counter when last message equals actual message id when building network message', () => {
    const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
    const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const dateMock = jest.spyOn(Date, 'now').mockImplementation(()=>sameMessageIdPrefix);
    const msg = builder.buildOPCUANetworkMessage([],new Date(), DataSetClassIds.mam, '0',undefined);
    expect(msg.MessageId.charAt(0)).toEqual('0');
    dateMock.mockRestore();
});


test('should increase over flow counter when last message equals actual message id when building metada message', () => {
    const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
    const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const dateMock = jest.spyOn(Date, 'now').mockImplementation(()=>sameMessageIdPrefix);
    const msg = builder.buildOPCUAMetaDataMessage('metadata','meda description', {}, '0',0,'0','sub');
    expect(msg.MessageId.charAt(0)).toEqual('0');
    dateMock.mockRestore();
});

test('should update last message when building metadata message', () => {
    const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
    const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
    const msg = builder.buildOPCUAMetaDataMessage('metadata','meda description', {}, '0',0,'0','sub');
    expect(msg.MessageId).toEqual(builder.lastMessageId);
});

test('should update last message when building network  message', () => {
    const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
    const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
    const msg = builder.buildOPCUANetworkMessage([],new Date(), DataSetClassIds.mam, '0',undefined);
    expect(msg.MessageId).toEqual(builder.lastMessageId);
});
