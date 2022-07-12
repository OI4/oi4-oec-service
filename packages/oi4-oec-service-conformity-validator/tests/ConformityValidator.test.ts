import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';
import {IMessageBusLookup, PubResponse} from '../src/model/IMessageBusLookup';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter, EAssetType, Resource} from '@oi4/oi4-oec-service-model';



import mam_valid from './__fixtures__/mam_valid.json';
import mam_invalidDscId from './__fixtures__/mam_invalidDscId.json';
import health_valid from './__fixtures__/health_valid.json';
import health_invalidDscId from './__fixtures__/health_invalidDscId.json';
import profile_app_valid from './__fixtures__/profile_app_valid.json';
import profile_app_data_valid from './__fixtures__/profile_app_data_valid.json';
import profile_device_valid from './__fixtures__/profile_device_valid.json';
import profile_device_data_valid from './__fixtures__/profile_device_data_valid.json';
import profile_app_data_invalid from './__fixtures__/profile_app_data_invalid.json';
import profile_device_data_invalid from './__fixtures__/profile_device_data_invalid.json';



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
const defaultTime = new Date('2020-01-01');

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

    it('should return full resource conformity for mam', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(mam_valid));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'mam');
        expect(result.validity).toBe(EValidity.ok);

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource mam on ${defaultTopic}/get/mam (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on mam from ${defaultTopic}/pub/mam.`, ESyslogEventFilter.warning);
    })

    it('should return partial conformity for mam with invalid correlationId', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(new Date('2010-01-01')); // enforce wrong correlation id

        const objectUnderTest = getObjectUnderTest(JSON.stringify(mam_valid));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'mam');
        expect(result.validity).toBe(EValidity.partial);

        expect(LOGGER.log).toHaveBeenCalledTimes(3);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource mam on ${defaultTopic}/get/mam (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on mam from ${defaultTopic}/pub/mam.`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`CorrelationId did not pass for ${defaultTopic}/pub/mam.`, ESyslogEventFilter.error);
    })

    it('should return partial conformity for mam with invalid DataSetClassId', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(mam_invalidDscId));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'mam');
        expect(result.validity).toBe(EValidity.partial);

        expect(LOGGER.log).toHaveBeenCalledTimes(3);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource mam on ${defaultTopic}/get/mam (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on mam from ${defaultTopic}/pub/mam.`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`DataSetClassId did not pass for ${defaultTopic}/pub/mam.`, ESyslogEventFilter.error);
    })

    it('should return full resource conformity for health', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(health_valid));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'health');
        expect(result.validity).toBe(EValidity.ok);

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource health on ${defaultTopic}/get/health (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on health from ${defaultTopic}/pub/health.`, ESyslogEventFilter.warning);
    })

    it('should return partial conformity for health with invalid correlationId', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(new Date('2010-01-01')); // enforce wrong correlation id

        const objectUnderTest = getObjectUnderTest(JSON.stringify(health_valid));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'health');
        expect(result.validity).toBe(EValidity.partial);

        expect(LOGGER.log).toHaveBeenCalledTimes(3);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource health on ${defaultTopic}/get/health (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on health from ${defaultTopic}/pub/health.`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`CorrelationId did not pass for ${defaultTopic}/pub/health.`, ESyslogEventFilter.error);
    })

    it('should return partial conformity for health with invalid DataSetClassId', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(health_invalidDscId));
        const result = await objectUnderTest.checkResourceConformity(defaultTopic, 'health');
        expect(result.validity).toBe(EValidity.partial);

        expect(LOGGER.log).toHaveBeenCalledTimes(3);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource health on ${defaultTopic}/get/health (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on health from ${defaultTopic}/pub/health.`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`DataSetClassId did not pass for ${defaultTopic}/pub/health.`, ESyslogEventFilter.error);
    })

    it.each([profile_app_valid, profile_app_data_valid])(
        '(%#) should return full conformity for application profile -> %s',
        async (obj) => {
            jest
            .useFakeTimers()
            .setSystemTime(defaultTime);
    
            const objectUnderTest = getObjectUnderTest(JSON.stringify(obj));
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
            expect(result.validity).toBe(EValidity.ok);
    
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
        }
      )

      it.each([profile_device_valid, profile_device_data_valid])(
        '(%#) should return full conformity for device profile -> %s',
        async (obj) => {
            jest
            .useFakeTimers()
            .setSystemTime(defaultTime);
    
            const objectUnderTest = getObjectUnderTest(JSON.stringify(obj));
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.device);
            expect(result.validity).toBe(EValidity.ok);
    
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
        }
      )

      it('should return partial conformity for application profile with missing metadata', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(profile_app_data_invalid));
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "data" but not "metadata".');

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
    })

    it('should return partial conformity for device profile with missing metadata', async ()=> {

        jest
        .useFakeTimers()
        .setSystemTime(defaultTime);

        const objectUnderTest = getObjectUnderTest(JSON.stringify(profile_device_data_invalid));
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "data" but not "metadata".');

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
    })



    it('should return mandatory application resources', ()=> {
        const resources = ConformityValidator.getMandatoryResources(EAssetType.application);
        expect([Resource.MAM, Resource.HEALTH, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.PROFILE, Resource.PUBLICATION_LIST].sort()).toEqual(resources.sort());

    })

    it('should return mandatory device resources', ()=> {
        const resources = ConformityValidator.getMandatoryResources(EAssetType.device);
        expect([Resource.MAM, Resource.HEALTH, Resource.PROFILE, Resource.REFERENCE_DESIGNATION].sort()).toEqual(resources.sort());

    })


    it('should check oi4 conformity', async ()=> {
        const result = await ConformityValidator.checkOI4IDConformity(defaultAppId);
        expect(result).toBe(true);
    })
});