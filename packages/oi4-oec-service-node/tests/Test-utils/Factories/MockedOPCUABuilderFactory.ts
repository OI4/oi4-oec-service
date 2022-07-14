import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';

export class MockedOPCUABuilderFactory {

    public static mockOPCUABuilderMethod(methodName: any, mockedImplementation: Function) {
        return jest
            .spyOn(OPCUABuilder.prototype, methodName)
            .mockImplementation((... args: any) => {
                return mockedImplementation.call(args);
            });
    }

    public static resetAllMocks() {
        jest.resetAllMocks();
    }

    public static getMockedBuilderWithoutMockedMethods(fakeOi4Id: string, fakeServiceType: string): OPCUABuilder {
        return new OPCUABuilder(fakeOi4Id, fakeServiceType);
    }

    static getMockedBuilderWithMockedMethods(info: any, appId: string): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return true;
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkPayloadType', () => {
            return Promise.resolve('FakeType');
        });

        return MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(appId, info.fakeServiceType);
    }

}