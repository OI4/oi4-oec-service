import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';

export class MockedOPCUABuilderFactory {

    public static mockOPCUABuilderMethod(methodName: any, mockedImplementation: Function) {
        return jest
            .spyOn(OPCUABuilder.prototype, methodName)
            .mockImplementation((args: any) => {
                return mockedImplementation.call(args);
            });
    }

    public static getMockedOPCUABuilder(fakeOi4Id: string, fakeServiceType: string): OPCUABuilder {
        return new OPCUABuilder(fakeOi4Id, fakeServiceType);
    }

    public static resetAllMocks() {
        jest.resetAllMocks();
    }

}