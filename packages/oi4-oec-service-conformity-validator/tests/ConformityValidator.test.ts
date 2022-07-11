import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';
import {IMessageBusLookup} from '../src/model/IMessageBusLookup';
// import {LOGGER} from '@oi4/oi4-oec-service-logger';


import mam_valid from './__fixtures__/mam_valid.json';

const publish = jest.fn();

jest.mock('@oi4/oi4-oec-service-logger', () => ({
        LOGGER : {
            log:jest.fn(),
        },
        initializeLogger: jest.fn(),
    }) 
)


const getMqttClient = (): mqtt.AsyncClient => {
    return {
        connected: true,
        publish: jest.fn(),
    } as unknown as mqtt.AsyncClient;
}

const defaultAppId = 'openindustry4.com/1/1/1';

function getObjectUnderTest(pubResponse: string): ConformityValidator {
    const mqttClient = getMqttClient();

    publish.mockImplementation(async ()=> {
        return Promise.resolve({
            rawMessage: Buffer.from(pubResponse),
            topic: ''
        });
    });

    const messageBusLookup: IMessageBusLookup = {
        getMessage: publish,
    }
   
    return new ConformityValidator(defaultAppId, mqttClient, messageBusLookup);
} 

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