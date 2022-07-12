import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';
import {IMessageBusLookup, PubResponse} from '../src/model/IMessageBusLookup';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter} from '@oi4/oi4-oec-service-model';



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

const defaultAppId = 'openindustry4.com/nd/nd/nd';
const defaultTopic = `oi4/${defaultAppId}`;

function getObjectUnderTest(pubResponse: string): ConformityValidator {
    const mqttClient = getMqttClient();

    publish.mockImplementation(async ()=> {
        const response = new PubResponse('', Buffer.from(pubResponse));
        return Promise.resolve(response);
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

    it('should check mam resource conformity', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-01-01'));

        const objectUnderTest = getObjectUnderTest(JSON.stringify(mam_valid));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'mam');
        expect(result.validity).toBe(EValidity.ok);

        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource mam on ${defaultTopic}/get/mam (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on mam from ${defaultTopic}/pub/mam.`, ESyslogEventFilter.warning);
    })

    it('should check oi4 conformity', async ()=> {
        const result = await ConformityValidator.checkOI4IDConformity(defaultAppId);
        expect(result).toBe(true);
    })
});