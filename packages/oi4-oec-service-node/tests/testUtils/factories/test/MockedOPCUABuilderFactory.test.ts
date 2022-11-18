import {MockedOPCUABuilderFactory} from '../MockedOPCUABuilderFactory';
import {EOPCUAMessageType, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-model';

describe('Unit test for MockedOPCUABuilderFactory.test', () => {

    const oid4Id = new Oi4Identifier('acme.com', 'model', 'productCode', 'serialNumber');

    beforeEach(() => {
        MockedOPCUABuilderFactory.resetAllMocks();
    });

    it('The factory works, a method with just one parameter is properly mocked', async () => {
        const checkOPCUAJSONValidityMock = MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve('WTF')
        });

        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(oid4Id, ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'});
        expect(checkOPCUAJSONValidityMock).toHaveBeenCalled();
        expect(valid).toBe('WTF');
    });

    it('The factory works, the default methods are mocked', async () => {
        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithMockedMethods(oid4Id, ServiceTypes.AGGREGATION);

        expect(await mockedBuilder.checkOPCUAJSONValidity({Payload: 'payload'})).toBe(true);
        expect(mockedBuilder.checkTopicPath('path')).toBe(true);
    });

    it('The factory works, a method with several parameter is mocked and the parameters are passed successfully', async () => {

        const metaDataName = 'metadata';
        const metaDataDescription = 'metadata description';
        const classId = 'classId';
        const fieldProperty = {payload: 'payload'};
        const dataSetWriterId = 1;
        const filter = 'filter';
        const source = 'source';
        const correlationId = 'correlationId';

        const checkOPCUAJSONValidityMock = MockedOPCUABuilderFactory.mockOPCUABuilderMethod('buildOPCUAMetaDataMessage',
            () => {
                return {
                    MessageId: '1',
                    MessageType: EOPCUAMessageType.uaMetadata,
                    PublisherId: '2',
                    DataSetWriterId: 3,
                    Filter: filter,
                    Source: source,
                    CorrelationId: correlationId,
                    MetaData: {}
                }
            });


        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(oid4Id, ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.buildOPCUAMetaDataMessage(metaDataName, metaDataDescription, fieldProperty, classId, dataSetWriterId, filter, source, correlationId);
        expect(checkOPCUAJSONValidityMock).toHaveBeenCalled();
        expect(valid).not.toBe(undefined);
        expect(valid.MessageId).toBe('1');
        expect(valid.MessageType).toBe(EOPCUAMessageType.uaMetadata);
        expect(valid.PublisherId).toBe('2');
        expect(valid.DataSetWriterId).toBe(3);
        expect(valid.Filter).toBe(filter);
        expect(valid.Source).toBe(source);
        expect(valid.CorrelationId).toBe(correlationId);
        expect(valid.MetaData).toStrictEqual({});
    });

    it('The factory works, when a method is not mocked when called undefined is retuned', async () => {
        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(oid4Id, ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'});
        expect(valid).toBe(undefined);
    });


});
