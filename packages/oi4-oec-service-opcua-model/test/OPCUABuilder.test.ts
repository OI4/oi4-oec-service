import {OPCUABuilder} from '../src';
import {NetworkMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from './__fixtures__/mam_network_message.json';
import invalidMam from './__fixtures__/invalid_mam_network_message.json';
import {DataSetClassIds} from '@oi4/oi4-oec-service-model';
import {ServiceTypes, IOPCUADataSetMessage} from '@oi4/oi4-oec-service-opcua-model';

function createOPCUABuilderWithLastMessageId(prefix: string): OPCUABuilder {
    const pubId = 'pubId';
    const builder = new OPCUABuilder('oi4id',ServiceTypes.REGISTRY,undefined);
    builder.lastMessageId = `${prefix}-${pubId}`;
    builder.publisherId = pubId;
    return builder;
}

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

test('should increase over flow counter when last message equals actual message id when building network message', () => {
    const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
    const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const dateMock = jest.spyOn(Date, 'now').mockImplementation(()=>sameMessageIdPrefix);
    const msg = builder.buildOPCUANetworkMessage([],new Date(), DataSetClassIds.mam, '0');
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
    const msg = builder.buildOPCUANetworkMessage([],new Date(), DataSetClassIds.mam, '0');
    expect(msg.MessageId).toEqual(builder.lastMessageId);
});

test('builds paginated message', () => {
    const builder = new OPCUABuilder('vendor.com/1/2/3', ServiceTypes.UTILITY);

    const messages: IOPCUADataSetMessage[] = [{
        DataSetWriterId: 1,
        subResource: 'a/b/c/d',
        filter: 'filter',
        Payload: [],
        Timestamp: '2022-01-01T12:00:00.000'
    }]

    const timeStamp = new Date(2022, 1, 2);
    const paginatedMessages = builder.buildPaginatedOPCUANetworkMessageArray(messages, timeStamp, DataSetClassIds.mam, 'abcd'); 

    expect(paginatedMessages.length).toEqual(1);
    expect(paginatedMessages[0].Messages.length).toEqual(2);
    expect(paginatedMessages[0].Messages[0].DataSetWriterId).toBe(1);
    expect(paginatedMessages[0].Messages[0].subResource).toBe('a/b/c/d');
    expect(paginatedMessages[0].Messages[0].filter).toBe('filter');
    expect(paginatedMessages[0].Messages[0].Timestamp).toEqual('2022-02-01T23:00:00.000Z');

    expect(paginatedMessages[0].Messages[1].Payload.page).toBe(1);
})