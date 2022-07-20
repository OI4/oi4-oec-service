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
import subscriptionList_valid from './__fixtures__/subscriptionList_valid.json';
import data_valid from './__fixtures__/data_valid.json';
import metadata_valid from './__fixtures__/metadata_valid.json';
import referenceDesignation_valid from './__fixtures__/referenceDesignation_valid.json';
import license_with_pagination_valid from './__fixtures__/license_with_pagination_valid.json';
import config_valid from './__fixtures__/config_valid.json';
import event_valid from './__fixtures__/event_valid.json';
import interfaces_valid from './__fixtures__/interfaces_valid.json';
import rtLicense_valid from './__fixtures__/rtLicense_valid.json';

import profile_app_valid from './__fixtures__/profile_app_valid.json';
import profile_app_data_valid from './__fixtures__/profile_app_data_valid.json';
import profile_device_valid from './__fixtures__/profile_device_valid.json';
import profile_device_data_valid from './__fixtures__/profile_device_data_valid.json';
import profile_app_data_invalid from './__fixtures__/profile_app_data_invalid.json';
import profile_device_data_invalid from './__fixtures__/profile_device_data_invalid.json';
import profile_device_unknown_resource from './__fixtures__/profile_device_unknown_resource.json';
import profile_full_valid from './__fixtures__/profile_full_valid.json';


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


const validDeviceTestData: ITestData[] =[
        {resource: Resource.MAM, message: mam_valid},
        {resource: Resource.HEALTH, message: health_valid},
        {resource: Resource.PROFILE, message: profile_app_valid},
        {resource: Resource.LICENSE, message: license_valid},
        {resource: Resource.LICENSE, message: license_with_pagination_valid},
        {resource: Resource.LICENSE_TEXT, message: licenseText_valid},
        {resource: Resource.PUBLICATION_LIST, message: publicationList_valid},
        {resource: Resource.SUBSCRIPTION_LIST, message: subscriptionList_valid},
        {resource: Resource.REFERENCE_DESIGNATION, message: referenceDesignation_valid},
        {resource: Resource.DATA, message: data_valid},
        {resource: Resource.CONFIG, message: config_valid},
        {resource: Resource.EVENT, message: event_valid},
        {resource: Resource.INTERFACES, message: interfaces_valid},
        {resource: Resource.RT_LICENSE, message: rtLicense_valid}];

const allValidDeviceTestData: ITestData[] = validDeviceTestData.concat([
            {resource: Resource.METADATA, message: metadata_valid}]);
        

function getObjectUnderTest(response: ITestData[] = [], fixCorrelationId = true): ConformityValidator
{
    const mqttClient = getMqttClient();

    publish.mockImplementation(async (request: GetRequest) => {

        const responseEntry = response.find((entry) => 
            entry.resource==request.Resource && 
            equal(entry.subResource, request.SubResource) &&
            equal(entry.filter, request.Filter));
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
   
    return new ConformityValidator(defaultAppId, mqttClient, 'Registry',  messageBusLookup);
}


interface ITestData
{
    resource: Resource;
    subResource?: string;
    filter?: string;
    message: any;
}


describe('Unit test for ConformityValidator ', () => {

    beforeEach(()=> {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });


    it('should return conformity for all types of resources' , async ()=> {

        const applicationMessages: ITestData[] = [
            {resource: Resource.MAM, message: mam_valid},
            {resource: Resource.HEALTH, message: health_valid},
            {resource: Resource.PROFILE, message: profile_full_valid},
            {resource: Resource.LICENSE, message: license_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'MIT', message: licenseText_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'Apache%202.0', message: licenseText_valid},
            {resource: Resource.PUBLICATION_LIST, message: publicationList_valid},
            {resource: Resource.CONFIG, message: config_valid},
            {resource: Resource.REFERENCE_DESIGNATION, message: referenceDesignation_valid},
            {resource: Resource.EVENT, message: event_valid},
            {resource: Resource.RT_LICENSE, message: rtLicense_valid},
            {resource: Resource.DATA, message: data_valid},
            {resource: Resource.METADATA, subResource: 'openindustry4.com/nd/nd/nd', filter: 'oee', message: metadata_valid},
            {resource: Resource.INTERFACES, message: interfaces_valid},
            {resource: Resource.SUBSCRIPTION_LIST, message: subscriptionList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resource['mam'].validity).toBe(EValidity.ok);
        expect(result.resource['health'].validity).toBe(EValidity.ok);
        expect(result.resource['profile'].validity).toBe(EValidity.ok);
        expect(result.resource['license'].validity).toBe(EValidity.ok);
        expect(result.resource['licenseText'].validity).toBe(EValidity.ok);
        expect(result.resource['publicationList'].validity).toBe(EValidity.ok);
        expect(result.resource['config'].validity).toBe(EValidity.ok);
        expect(result.resource['referenceDesignation'].validity).toBe(EValidity.ok);
        expect(result.resource['event'].validity).toBe(EValidity.default);
        expect(result.resource['event'].validityErrors).toContain('Resource result ignored, ok');
        expect(result.resource['rtLicense'].validity).toBe(EValidity.ok);
        expect(result.resource['data'].validity).toBe(EValidity.ok);
        expect(result.resource['metadata'].validity).toBe(EValidity.ok);
        expect(result.resource['interfaces'].validity).toBe(EValidity.default);
        expect(result.resource['interfaces'].validityErrors).toContain('Resource result ignored, ok');
        expect(result.resource['subscriptionList'].validity).toBe(EValidity.ok);
        expect(result.profileResourceList.length).toEqual(14)
    });


    it('should return full application conformity' , async ()=> {

        const applicationMessages: ITestData[] = [
            {resource: Resource.MAM, message: mam_valid},
            {resource: Resource.HEALTH, message: health_valid},
            {resource: Resource.PROFILE, message: profile_app_valid},
            {resource: Resource.LICENSE, message: license_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'MIT', message: licenseText_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'Apache%202.0', message: licenseText_valid},
            {resource: Resource.PUBLICATION_LIST, message: publicationList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resource['mam'].validity).toBe(EValidity.ok);
        expect(result.resource['health'].validity).toBe(EValidity.ok);
        expect(result.resource['profile'].validity).toBe(EValidity.ok);
        expect(result.resource['license'].validity).toBe(EValidity.ok);
        expect(result.resource['licenseText'].validity).toBe(EValidity.ok);
        expect(result.resource['publicationList'].validity).toBe(EValidity.ok);
        expect(result.profileResourceList.sort()).toEqual([Resource.HEALTH, Resource.LICENSE, Resource.LICENSE_TEXT, Resource.MAM, Resource.PROFILE, Resource.PUBLICATION_LIST])
    });

    it('should return full application conformity for license with pagination' , async ()=> {

        const applicationMessages: ITestData[] = [
            {resource: Resource.MAM, message: mam_valid},
            {resource: Resource.HEALTH, message: health_valid},
            {resource: Resource.PROFILE, message: profile_app_valid},
            {resource: Resource.LICENSE, message: license_with_pagination_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'MIT', message: licenseText_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'Apache%202.0', message: licenseText_valid},
            {resource: Resource.PUBLICATION_LIST, message: publicationList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resource['license'].validity).toBe(EValidity.ok);
        expect(result.resource['licenseText'].validity).toBe(EValidity.ok);
    });



    it('should return partial application conformity if license text is missing' , async ()=> {

        // license resource references an "Apache" license but this license is missing in the "LicenseText" resource
        const applicationMessages: ITestData[] = [
            {resource: Resource.MAM, message: mam_valid},
            {resource: Resource.HEALTH, message: health_valid},
            {resource: Resource.PROFILE, message: profile_app_valid},
            {resource: Resource.LICENSE, message: license_valid},
            {resource: Resource.LICENSE_TEXT, subResource: 'openindustry4.com/nd/nd/nd', filter: 'MIT', message: licenseText_valid},
            {resource: Resource.PUBLICATION_LIST, message: publicationList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.partial);
        expect(result.resource['licenseText'].validity).toBe(EValidity.nok);
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
        expect(result.profileResourceList.sort()).toEqual([Resource.HEALTH, Resource.MAM, Resource.PROFILE, Resource.REFERENCE_DESIGNATION])
    });
    
    it('should detect unknown resource in profile' , async ()=> {

        const deviceMessages: ITestData[] = [
            {resource: Resource.MAM, subResource: defaultSubResource, message: mam_valid},
            {resource: Resource.HEALTH, subResource: defaultSubResource, message: health_valid},
            {resource: Resource.PROFILE, subResource: defaultSubResource, message: profile_device_unknown_resource},
            {resource: Resource.REFERENCE_DESIGNATION, subResource: defaultSubResource, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSubResource);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resource['unknown'].validity).toBe(EValidity.nok);
        expect(result.resource['unknown'].validityErrors).toContain('Resource is unknown to oi4');
    });

    it('should return partial device conformity if health is wrong' , async ()=> {

        const deviceMessages: ITestData[] = [
            {resource: Resource.MAM, subResource: defaultSubResource, message: mam_valid},
            {resource: Resource.HEALTH, subResource: defaultSubResource, message: mam_valid}, // return mam for health
            {resource: Resource.PROFILE, subResource: defaultSubResource, message: profile_device_valid},
            {resource: Resource.REFERENCE_DESIGNATION, subResource: defaultSubResource, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSubResource);

        expect(result.validity).toBe(EValidity.partial);
        expect(result.resource['mam'].validity).toBe(EValidity.ok);
        expect(result.resource['health'].validity).toBe(EValidity.partial);
        expect(result.resource['profile'].validity).toBe(EValidity.ok);
        expect(result.resource['referenceDesignation'].validity).toBe(EValidity.ok);
        expect(LOGGER.log).toHaveBeenCalledWith(`Schema validation of message ${defaultTopic}/pub/health/${defaultSubResource} was not successful.`, ESyslogEventFilter.error);
    });

    it('should detect missing meta data' , async ()=> {

        const deviceMessages: ITestData[] = [
            {resource: Resource.MAM, subResource: defaultSubResource, message: mam_valid},
            {resource: Resource.HEALTH, subResource: defaultSubResource, message: health_valid},
            {resource: Resource.PROFILE, subResource: defaultSubResource, message: profile_device_data_valid},
            {resource: Resource.REFERENCE_DESIGNATION, subResource: defaultSubResource, message: referenceDesignation_valid},
            {resource: Resource.DATA, subResource: defaultSubResource, message: data_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSubResource);

        expect(result.validity).toBe(EValidity.partial);
        expect(result.resource['metadata'].validity).toBe(EValidity.nok);
    });

    it('should evaluate additional resources not included in the profile' , async ()=> {

        const deviceMessages: ITestData[] = [
            {resource: Resource.MAM, subResource: defaultSubResource, message: mam_valid},
            {resource: Resource.HEALTH, subResource: defaultSubResource, message: health_valid},
            {resource: Resource.PROFILE, subResource: defaultSubResource, message: profile_device_valid},
            {resource: Resource.REFERENCE_DESIGNATION, subResource: defaultSubResource, message: referenceDesignation_valid},
            {resource: Resource.CONFIG, subResource: defaultSubResource, message: config_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSubResource, [Resource.CONFIG]);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.profileResourceList.sort()).toEqual([Resource.HEALTH, Resource.MAM, Resource.PROFILE, Resource.REFERENCE_DESIGNATION])
        expect(result.nonProfileResourceList).toEqual([Resource.CONFIG])
        expect(result.resource['config'].validity).toBe(EValidity.ok);
    });

    it.each(allValidDeviceTestData)(
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

      it.each(allValidDeviceTestData)(
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


      it.each(validDeviceTestData)(
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

    it.each(allValidDeviceTestData)(
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