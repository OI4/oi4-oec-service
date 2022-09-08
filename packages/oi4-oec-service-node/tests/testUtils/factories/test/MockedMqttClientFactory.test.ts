import mqtt from 'async-mqtt';
import {MockedMqttClientFactory} from '../MockedMqttClientFactory';

describe('Unit test for MockedMqttClientFactory ', () => {

    const genericArgsBuffer: string[] = new Array<string>();

    it('The factory works', async () => {
        const client: mqtt.AsyncClient = MockedMqttClientFactory.getMockedClientWithDefaultImplementation();

        client.publish(undefined, undefined, undefined);
        expect(client.publish).toHaveBeenCalled();

        client.on(undefined, undefined);
        expect(client.on).toHaveBeenCalled();
    });

    function genericCallback(... args: any[]) {
        if(args.length > 0) {
            if(typeof(args[0]) == 'string') {
                genericArgsBuffer.push(args[0]);
            } else {
                genericArgsBuffer.push(JSON.stringify(args[0]));
            }
        }
    }

    it('The factory works with custom function implementation', async () => {
        const client: mqtt.AsyncClient = MockedMqttClientFactory.getMockedClient(genericCallback, genericCallback);

        client.publish('publish', undefined, undefined);
        expect(genericArgsBuffer.length).toBe(1);
        expect(genericArgsBuffer[0]).toBe('publish');

        client.on('on', undefined);
        expect(genericArgsBuffer.length).toBe(2);
        expect(genericArgsBuffer[1]).toBe('on');
    });

});