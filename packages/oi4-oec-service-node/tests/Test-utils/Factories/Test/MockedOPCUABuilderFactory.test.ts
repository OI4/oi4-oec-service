import {MockedOPCUABuilderFactory} from '../MockedOPCUABuilderFactory';
import {EOPCUAMessageType, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for MockedOPCUABuilderFactory.test', () => {

    beforeEach(() => {
        MockedOPCUABuilderFactory.resetAllMocks();
    });

    it('The factory works, a method with just one parameter is properly mocked', async () => {
        const checkOPCUAJSONValidityMock = MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve('WTF')
        });

        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods('fakeOi4Id', ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'});
        expect(checkOPCUAJSONValidityMock).toHaveBeenCalled();
        expect(valid).toBe('WTF');
    });

    it('The factory works, the default methods are mocked', async () => {
        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithMockedMethods('fakeOi4Id', ServiceTypes.AGGREGATION);

        expect(await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'})).toBe(true);
        expect(mockedBuilder.checkTopicPath('path')).toBe(true);
        expect(await mockedBuilder.checkPayloadType({payload: 'payload'})).toBe('FakeType');
    });

    it('The factory works, a method with several parameter is mocked and the parameters are passed successfully', async () => {

        const metaDataName = 'metadata';
        const metaDataDescription = 'metadata description';
        const classId = 'classId';
        const fieldProperty = {payload: 'payload'};
        const dataSetWriterId = 1;
        const filter = 'filter';
        const subResource = 'subResource';
        const correlationId = 'correlationId';

        const checkOPCUAJSONValidityMock = MockedOPCUABuilderFactory.mockOPCUABuilderMethod('buildOPCUAMetaDataMessage',
            () => {
                return {
                    MessageId: '1',
                    MessageType: EOPCUAMessageType.uaData,
                    PublisherId: '2',
                    DataSetWriterId: 3,
                    filter: filter,
                    subResource: subResource,
                    correlationId: correlationId,
                    MetaData: {}
            }});

        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods('fakeOi4Id', ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.buildOPCUAMetaDataMessage(metaDataName, metaDataDescription, fieldProperty, classId, dataSetWriterId, filter, subResource, correlationId);
        expect(checkOPCUAJSONValidityMock).toHaveBeenCalled();
        expect(valid).not.toBe(undefined);
        expect(valid.MessageId).toBe('1');
        expect(valid.MessageType).toBe(EOPCUAMessageType.uaData);
        expect(valid.PublisherId).toBe('2');
        expect(valid.DataSetWriterId).toBe(3);
        expect(valid.filter).toBe(filter);
        expect(valid.subResource).toBe(subResource);
        expect(valid.correlationId).toBe(correlationId);
        expect(valid.MetaData).toStrictEqual({});
    });

    it('The factory works, when a method is not mocked when called undefined is retuned', async () => {
        const mockedBuilder = MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods('fakeOi4Id', ServiceTypes.AGGREGATION);
        const valid = await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'});
        expect(valid).toBe(undefined);
    });


});
