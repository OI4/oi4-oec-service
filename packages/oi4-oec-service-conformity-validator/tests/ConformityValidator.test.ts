import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';

import mam_valid from './__fixtures__/mam_valid.json';

const once = jest.fn(); 
const publish = jest.fn();
const subscribe = jest.fn();
const unsubscribe = jest.fn();

const getMqttClient = (): mqtt.AsyncClient => {
    return {
        connected: true,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        once: once,
        publish: publish
    } as unknown as mqtt.AsyncClient;
}

const defaultAppId = 'openindustry4.com/1/1/1';

function getObjectUnderTest(receivedMessage: string): ConformityValidator {
    const mqttClient = getMqttClient();
    let messageCallback: mqtt.OnMessageCallback;
    let subscription: string | undefined;

    subscribe.mockImplementation((topic: string): Promise<mqtt.ISubscriptionGrant[]> =>
    {
        subscription = topic;
        return Promise.resolve([]);
    })

    unsubscribe.mockImplementation((topic: string | string[]): Promise<mqtt.IUnsubackPacket> => {
        if (topic == subscription)
        {
            subscription = undefined;
        }

        return Promise.resolve({cmd: 'unsuback'});
    })

    once.mockImplementation((event: string, cb: mqtt.OnMessageCallback): mqtt.AsyncMqttClient => {
        if (event == 'message')
        {
            messageCallback = cb;
        }

        return mqttClient;
    })

    publish.mockImplementation((topic: string, message: string): Promise<mqtt.IPublishPacket> => {

        const publishPacket = {
            cmd: 'publish',
            qos: 1,
            dup: false,
            retain: false,
            topic: topic,
            payload: message
        } as mqtt.IPublishPacket;

        if (subscription != undefined)
        {
            // simulate that the asset sends a response for the published message
            // (but only when someone a subscription is active)
            messageCallback(subscription, Buffer.from(receivedMessage, 'utf-8'), publishPacket);
        }

        return Promise.resolve(publishPacket);
    })
   
    return new ConformityValidator(defaultAppId, mqttClient);
} 


/*

function configureMessage(receivedTopic: string, receivedMessage: string): void
{
    let messageCallback: mqtt.OnMessageCallback;

    mqttClient.once.mockImplementation()


    jest.doMock('async-mqtt', ()=> {
        return {
            connected: true,
            reconnecting: false,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            once : (_event: 'message', cb: mqtt.OnMessageCallback): mqtt.AsyncMqttClient => {
                    messageCallback = cb;
                    return this;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            subscribe: (_topic: string): Promise<mqtt.ISubscriptionGrant[]> =>
            {
                return Promise.resolve([]);
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            unsubscribe : (_topic: string | string[]): Promise<mqtt.IUnsubackPacket> => {
                return Promise.resolve({cmd: 'unsuback'});
            },
            publish: (topic: string, message: string): Promise<mqtt.IPublishPacket> => {
                const publishPacket = {
                    cmd: 'publish',
                    qos: 1,
                    dup: false,
                    retain: false,
                    topic: topic,
                    payload: message
                } as mqtt.IPublishPacket;

                messageCallback(receivedTopic, Buffer.from(receivedMessage, 'utf-8'), publishPacket);
                return Promise.resolve(publishPacket);
            }
        }
    });
}

*/


describe('Unit test for ConformityValidator ', () => {

    beforeEach(()=> {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    it('should check resource conformity', async ()=> {
        const objectUnderTest = getObjectUnderTest(JSON.stringify(mam_valid));
        const result = await objectUnderTest.checkResourceConformity('a', 'b', 'mam');
        expect(result.validity).toBe(EValidity.partial);
    })

    it('should check oi4 conformity', async ()=> {
        const result = await ConformityValidator.checkOI4IDConformity('1/2/3/4');
        expect(result).toBe(true);
    })
});