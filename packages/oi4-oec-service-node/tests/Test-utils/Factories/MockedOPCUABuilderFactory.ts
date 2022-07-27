import {OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';

export class MockedOPCUABuilderFactory {

    public static mockOPCUABuilderMethod(methodName: any, mockedImplementation: Function) {
        return jest
            .spyOn(OPCUABuilder.prototype, methodName)
            .mockImplementation((...args: any) => {
                return mockedImplementation.call(args);
            });
    }

    public static resetAllMocks() {
        jest.resetAllMocks();
    }

    public static getMockedBuilderWithoutMockedMethods(oi4Id: string, serviceType: ServiceTypes): OPCUABuilder {
        return new OPCUABuilder(oi4Id, serviceType);
    }

    static getMockedBuilderWithMockedMethods(appId: string, serviceType: ServiceTypes): OPCUABuilder {
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkOPCUAJSONValidity', () => {
            return Promise.resolve(true)
        });
        MockedOPCUABuilderFactory.mockOPCUABuilderMethod('checkTopicPath', () => {
            return true;
        });

        return MockedOPCUABuilderFactory.getMockedBuilderWithoutMockedMethods(appId, serviceType);
    }

}
