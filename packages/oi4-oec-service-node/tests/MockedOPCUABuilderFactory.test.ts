// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {MockedOPCUABuilderFactory} from './utils/MockedOPCUABuilderFactory';

describe('Unit test for MockedOPCUABuilderFactory.test', () => {

    beforeEach(() => {
        MockedOPCUABuilderFactory.resetAllMocks();
    });

    it('The factory works', async () => {
        const checkOPCUAJSONValidityMock = MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {return Promise.resolve('WTF')});

        const mockedBuilder = MockedOPCUABuilderFactory.getMockedOPCUABuilder('fakeOi4Id', 'fakeServiceType');
        const valid = await mockedBuilder.checkOPCUAJSONValidity({payload: 'payload'});
        expect(checkOPCUAJSONValidityMock).toHaveBeenCalled();
        expect(valid).toBe('WTF');
    });

    it('The factory works 22', async () => {
        const mockedBuilder2 = MockedOPCUABuilderFactory.getMockedOPCUABuilder('fakeOi4Id', 'fakeServiceType');
        const valid2 = await mockedBuilder2.checkOPCUAJSONValidity({payload: 'payload'});
        expect(valid2).not.toBe('WTF');
    });
});