import {DataSetClassIds, IOPCUADataSetMessage, Oi4Identifier, OPCUABuilder, ServiceTypes} from '../../src';
import {NetworkMessageSchemaJson} from '@oi4/oi4-oec-json-schemas';
import Ajv from 'ajv'; /*tslint:disable-line*/
import mam from '../__fixtures__/mam_network_message.json';
import invalidMam from '../__fixtures__/invalid_mam_network_message.json';

const oi4Id = new Oi4Identifier('vendor.com', '13', '2', '3');

function createOPCUABuilderWithLastMessageId(prefix: string): OPCUABuilder {
    const pubId = 'pubId';
    const builder = new OPCUABuilder(oi4Id, ServiceTypes.REGISTRY, undefined);
    builder.lastMessageId = `${prefix}-${pubId}`;
    builder.publisherId = pubId;
    return builder;
}

describe('Unit test for MAMStorage reading', () => {

    it('checks OPC UA JSON validity', async () => {
        const builder = new OPCUABuilder(oi4Id, ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(mam).then(result => {
            expect(result).toBe(true);
        });
    });

    it('should fail on invalid network message', () => {
        const builder = new OPCUABuilder(oi4Id, ServiceTypes.AGGREGATION);
        return builder.checkOPCUAJSONValidity(invalidMam).then(result => {
            expect(result).toBe(false);
        });
    });

    it('should fail on on json schema validation problem', async () => {
        const jsonValidator = new Ajv();
        jsonValidator.addSchema(NetworkMessageSchemaJson, 'NetworkMessage.schema.json');

        const builder = new OPCUABuilder(oi4Id, ServiceTypes.AGGREGATION, 262144, jsonValidator);

        expect.assertions(1);
        try {
            await builder.checkOPCUAJSONValidity(mam);
        } catch (error) {
            expect(error).toBe('Validation failed with: can\'t resolve reference DataSetMessage.schema.json from id NetworkMessage.schema.json#');
        }
    });


    it('should increase over flow counter when last message equals actual message id when building network message', () => {
        const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
        const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const dateMock = jest.spyOn(Date, 'now').mockImplementation(() => sameMessageIdPrefix);
        const msg = builder.buildOPCUANetworkMessage([], new Date(), DataSetClassIds.MAM, '0');
        expect(msg.MessageId.charAt(0)).toEqual('0');
        dateMock.mockRestore();
    });


    it('should increase over flow counter when last message equals actual message id when building metada message', () => {
        const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
        const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const dateMock = jest.spyOn(Date, 'now').mockImplementation(() => sameMessageIdPrefix);
        const msg = builder.buildOPCUAMetaDataMessage('metadata', 'meda description', {}, '0', 0, '0', 'sub');
        expect(msg.MessageId.charAt(0)).toEqual('0');
        dateMock.mockRestore();
    });

    it('should update last message when building metadata message', () => {
        const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
        const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
        const msg = builder.buildOPCUAMetaDataMessage('metadata', 'meda description', {}, '0', 0, '0', 'sub');
        expect(msg.MessageId).toEqual(builder.lastMessageId);
    });

    it('should update last message when building network  message', () => {
        const sameMessageIdPrefix = `abc/${ServiceTypes.REGISTRY}/oi4`;
        const builder = createOPCUABuilderWithLastMessageId(sameMessageIdPrefix);
        const msg = builder.buildOPCUANetworkMessage([], new Date(), DataSetClassIds.mam, '0');
        expect(msg.MessageId).toEqual(builder.lastMessageId);
    });

    it('builds two paginated messages if message size is small', () => {
        const smallMessageSize = 10;
        const oi4Id = new Oi4Identifier('vendor.com', '13', '2', '3');
        const builder = new OPCUABuilder(oi4Id, ServiceTypes.UTILITY, smallMessageSize);

        const messages: IOPCUADataSetMessage[] = [{
            DataSetWriterId: 1,
            Source: 'a/b/c/d',
            Filter: 'filter',
            Payload: [],
            Timestamp: '2022-01-01T12:00:00.000'
        },
            {
                DataSetWriterId: 2,
                Source: 'e/f/g/h',
                Filter: 'oee',
                Payload: [],
                Timestamp: '2022-01-01T12:00:00.000'
            }]

        const timeStamp = new Date(2022, 1, 2);
        const paginatedMessages = builder.buildPaginatedOPCUANetworkMessageArray(messages, timeStamp, DataSetClassIds.mam, 'abcd');

        expect(paginatedMessages.length).toEqual(2);
        expect(paginatedMessages[0].Messages.length).toEqual(2);
        expect(paginatedMessages[0].Messages[0].DataSetWriterId).toBe(1);
        expect(paginatedMessages[0].Messages[0].Source).toBe('a/b/c/d');
        expect(paginatedMessages[0].Messages[0].Filter).toBe('filter');
        expect(paginatedMessages[0].Messages[0].Timestamp).toEqual('2022-02-01T23:00:00.000Z');

        expect(paginatedMessages[0].Messages[1].Payload.Page).toBe(1);
        expect(paginatedMessages[0].Messages[1].Payload.PerPage).toBe(1);
        expect(paginatedMessages[0].Messages[1].Payload.TotalCount).toBe(2);
        expect(paginatedMessages[0].Messages[1].Payload.HasNext).toBeTruthy();
        expect(paginatedMessages[0].Messages[1].Payload.PaginationId).toBeTruthy(); // TODO:

        expect(paginatedMessages[1].Messages[0].DataSetWriterId).toBe(2);
        expect(paginatedMessages[1].Messages[0].Source).toBe('e/f/g/h');
        expect(paginatedMessages[1].Messages[0].Filter).toBe('oee');
        expect(paginatedMessages[1].Messages[0].Timestamp).toEqual('2022-02-01T23:00:00.000Z');

        expect(paginatedMessages[1].Messages[1].Payload.Page).toBe(2);
        expect(paginatedMessages[1].Messages[1].Payload.PerPage).toBe(1);
        expect(paginatedMessages[1].Messages[1].Payload.TotalCount).toBe(2);
        expect(paginatedMessages[1].Messages[1].Payload.HasNext).toBeFalsy();
        expect(paginatedMessages[0].Messages[1].Payload.PaginationId).toBeTruthy(); // TODO:
    })

    it('builds one paginated message if message size is large', () => {
        const largeMessageSize = 100000;
        const oi4Id = new Oi4Identifier('vendor.com', '13', '2', '3');
        const builder = new OPCUABuilder(oi4Id, ServiceTypes.UTILITY, largeMessageSize);

        const messages: IOPCUADataSetMessage[] = [{
            DataSetWriterId: 1,
            Source: Oi4Identifier.fromString('a/b/c/d'),
            Filter: 'filter',
            Payload: [],
            Timestamp: '2022-01-01T12:00:00.000'
        },
            {
                DataSetWriterId: 2,
                Source: Oi4Identifier.fromString('e/f/g/h'),
                Filter: 'oee',
                Payload: [],
                Timestamp: '2022-01-01T12:00:00.000'
            }]

        const timeStamp = new Date(2022, 1, 2);
        const paginatedMessages = builder.buildPaginatedOPCUANetworkMessageArray(messages, timeStamp, DataSetClassIds.mam, 'abcd');

        expect(paginatedMessages.length).toEqual(1);
        expect(paginatedMessages[0].Messages.length).toEqual(3);
        expect(paginatedMessages[0].Messages[0].DataSetWriterId).toBe(1);
        expect(paginatedMessages[0].Messages[0].Source).toBe('a/b/c/d');
        expect(paginatedMessages[0].Messages[0].Filter).toBe('filter');
        expect(paginatedMessages[0].Messages[0].Timestamp).toEqual('2022-02-01T23:00:00.000Z');

        expect(paginatedMessages[0].Messages[1].DataSetWriterId).toBe(2);
        expect(paginatedMessages[0].Messages[1].Source).toBe('e/f/g/h');
        expect(paginatedMessages[0].Messages[1].Filter).toBe('oee');
        expect(paginatedMessages[0].Messages[1].Timestamp).toEqual('2022-02-01T23:00:00.000Z');

        expect(paginatedMessages[0].Messages[2].Payload.Page).toBe(1);
        expect(paginatedMessages[0].Messages[2].Payload.PerPage).toBe(2);
        expect(paginatedMessages[0].Messages[2].Payload.TotalCount).toBe(2);
        expect(paginatedMessages[0].Messages[2].Payload.HasNext).toBeFalsy();
        expect(paginatedMessages[0].Messages[2].Payload.PaginationId).toBe(paginatedMessages[0].MessageId);
    })

});
