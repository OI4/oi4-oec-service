import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';
import {IMessageBusLookup, PubResponse, GetRequest} from '../src/model/IMessageBusLookup';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter, EAssetType, Resource} from '@oi4/oi4-oec-service-model';


import mam_valid from './__fixtures__/mam_valid.json';
import health_valid from './__fixtures__/health_valid.json';
import license_valid from './__fixtures__/license_valid.json';
import licenseText_valid from './__fixtures__/licenseText_valid.json';
import publicationList_valid from './__fixtures__/publicationList_valid.json';
import data_valid from './__fixtures__/data_valid.json';
import metadata_valid from './__fixtures__/metadata_valid.json';
import referenceDesignation_valid from './__fixtures__/referenceDesignation_valid.json';

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
const defaultSubResource = 'vendor.com/a/b/c'
const defaultTopic = `oi4/Registry/${defaultAppId}`;

function equal(a: string, b: string): boolean {
    if ((a == undefined|| a== null|| a.length==0) && (b==undefined || b==null|| b.length==0))
    {
        return true;
    }

    return a==b;
}


const allValidNetworkMessages: ITestData[] =[
        {resource: Resource.MAM, message: mam_valid},
        {resource: Resource.HEALTH, message: health_valid},
        {resource: Resource.PROFILE, message: profile_app_valid},
        {resource: Resource.LICENSE, message: license_valid},
        {resource: Resource.LICENSE_TEXT, message: licenseText_valid},
        {resource: Resource.PUBLICATION_LIST, message: publicationList_valid},
        {resource: Resource.REFERENCE_DESIGNATION, message: referenceDesignation_valid},
        {resource: Resource.DATA, message: data_valid}];

const allValidDeviceResources: ITestData[] = allValidNetworkMessages.concat([
            {resource: Resource.METADATA, message: metadata_valid}]);
        

function getObjectUnderTest(response: ITestData[] = [], fixCorrelationId = true): ConformityValidator
{
    const mqttClient = getMqttClient();

    publish.mockImplementation(async (request: GetRequest) => {

        const responseEntry = response.find((entry) => entry.resource==request.Resource && equal(entry.subResource, request.SubResource));
        const message = responseEntry.message;

        if (fixCorrelationId)
        {
            message.correlationId = request.Message.MessageId; 
        }

        return new PubResponse(request.getTopic('pub'), Buffer.from(JSON.stringify(message)));

    });
  
    const messageBusLookup: IMessageBusLookup = {
        getMessage: publish,
    }
   
    return new ConformityValidator(defaultAppId, mqttClient, messageBusLookup);
}


interface ITestData
{
    resource: Resource;
    subResource?: string;
    message: any;
}


describe('Unit test for ConformityValidator ', () => {

    beforeEach(()=> {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });


    it('should return full application conformity' , async ()=> {

        const applicationMessages: ITestData[] = [
            {resource: Resource.MAM, message: mam_valid},
            {resource: Resource.HEALTH, message: health_valid},
            {resource: Resource.PROFILE, message: profile_app_valid},
            {resource: Resource.LICENSE, message: license_valid},
            {resource: Resource.LICENSE_TEXT, message: licenseText_valid},
            {resource: Resource.PUBLICATION_LIST, message: publicationList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
    });


    it('should return full device conformity' , async ()=> {

        const deviceMessages: ITestData[] = [
            {resource: Resource.MAM, subResource: defaultSubResource, message: mam_valid},
            {resource: Resource.HEALTH, subResource: defaultSubResource, message: health_valid},
            {resource: Resource.PROFILE, subResource: defaultSubResource, message: profile_device_valid},
            {resource: Resource.REFERENCE_DESIGNATION, subResource: defaultSubResource, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSubResource);

        expect(result.validity).toBe(EValidity.ok);
    });

    

    it.each(allValidDeviceResources)(
        '($#) should return full resource conformity for -> $resource',
        async (data: ITestData) => {

            const objectUnderTest = getObjectUnderTest([data]);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, data.subResource);

            const getTopic: string = data.subResource == undefined ? `${defaultTopic}/get/${data.resource}` : `${defaultTopic}/get/${data.resource}/${data.subResource}`;
            const pubTopic: string = data.subResource == undefined ? `${defaultTopic}/pub/${data.resource}` : `${defaultTopic}/pub/${data.resource}/${data.subResource}`;

            expect(result.validity).toBe(EValidity.ok);
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.warning);
        }
      )

      it.each(allValidDeviceResources)(
        '($#) should return partial conformity for wrong correlationId -> $resource',
        async (data: ITestData) => {

            const objectUnderTest = getObjectUnderTest([data], false);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, data.subResource);

            const getTopic: string = data.subResource == undefined ? `${defaultTopic}/get/${data.resource}` : `${defaultTopic}/get/${data.resource}/${data.subResource}`;
            const pubTopic: string = data.subResource == undefined ? `${defaultTopic}/pub/${data.resource}` : `${defaultTopic}/pub/${data.resource}/${data.subResource}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(LOGGER.log).toHaveBeenCalledTimes(3);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`CorrelationId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
      )


      it.each(allValidNetworkMessages)(
        '($#) should return partial conformity for wrong DataSetId -> $resource',
        async (data: ITestData) => {

            // clone message:
            const clonedMessage = JSON.stringify(data.message);
            const message =JSON.parse(clonedMessage);
            message.DataSetClassId = 'C3ECB9BC-D021-4DB7-818B-41403BBA8449'; // enforce wrong DataSetClassId 

            const objectUnderTest = getObjectUnderTest([{resource: data.resource, message: message}]);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, data.subResource);

            const getTopic: string = data.subResource == undefined ? `${defaultTopic}/get/${data.resource}` : `${defaultTopic}/get/${data.resource}/${data.subResource}`;
            const pubTopic: string = data.subResource == undefined ? `${defaultTopic}/pub/${data.resource}` : `${defaultTopic}/pub/${data.resource}/${data.subResource}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(LOGGER.log).toHaveBeenCalledTimes(3);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`DataSetClassId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
      )

    it.each([profile_app_valid, profile_app_data_valid])(
        '($#) should return full conformity for application profile',
        async (obj) => {
            const objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message: obj}]);
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
            expect(result.validity).toBe(EValidity.ok);
    
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
        }
      )

      it('foo', async () => {
          let objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message: profile_app_valid}]);
          let result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
          expect(result.validity).toBe(EValidity.ok);
  
          expect(LOGGER.log).toHaveBeenCalledTimes(2);
          expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
          expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);

          objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message: profile_app_data_valid}]);
          result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
          expect(result.validity).toBe(EValidity.ok);
      }
    )

      it.each([profile_device_valid, profile_device_data_valid])(
        '($#) should return full conformity for device profile',
        async (obj) => {
            const objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message: obj}]);
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.device);
            expect(result.validity).toBe(EValidity.ok);
    
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
        }
      )

      it('should return partial conformity for application profile with missing metadata', async ()=> {

        const objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message:  profile_app_data_invalid}]);
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "data" but not "metadata".');

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
    })

    it('should return partial conformity for device profile with missing metadata', async ()=> {

        const objectUnderTest = getObjectUnderTest([{resource: Resource.PROFILE, message: profile_device_data_invalid}]);
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "data" but not "metadata".');

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
    })

    it.each(allValidDeviceResources)(
        '($#) should return full schema conformity for -> $resource',
        async (data: ITestData) => {
            const objectUnderTest = getObjectUnderTest();
            const result = await objectUnderTest.checkSchemaConformity(data.resource, data.message);

            expect(result.schemaResult).toBe(true);
        }
      )


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