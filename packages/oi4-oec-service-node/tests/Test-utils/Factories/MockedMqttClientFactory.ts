import mqtt from 'async-mqtt';

export class MockedMqttClientFactory {

    public static getMockedClientWithDefaultImplementation(): mqtt.AsyncClient {
        //FIXME Until now we mocked just the methods / attributes actually needed in our tests.
        // In case something else will be needed in further tests a mocked implementation
        // must be added here. This is why the ts-ignore above the return

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return {
            connected: true,
            reconnecting: false,
            publish: jest.fn(),
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            on: jest.fn(),
        }
    };

    public static getMockedClient(publish: Function, on: Function): mqtt.AsyncClient {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return {
            connected: true,
            reconnecting: false,
            // Here the ts-ignore is needed because esLint expect that the functions passed
            // as parameters implements a load of methods which are generally not needed
            // (or, at least, not all of them) in the scope of a test

            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            publish: publish,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            on: on
        }
    }

}