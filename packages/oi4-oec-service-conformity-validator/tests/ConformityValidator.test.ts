import mqtt = require('async-mqtt'); 
import {ConformityValidator, EValidity} from '../src/index';
import {IMessageBusLookup, PubResponse, GetRequest} from '../src/model/IMessageBusLookup';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {ESyslogEventFilter, EAssetType, Resource, getResource} from '@oi4/oi4-oec-service-model';



import profile_app_valid from './__fixtures__/profile_app_valid.json';
import profile_app_data_valid from './__fixtures__/profile_app_data_valid.json';
import profile_device_valid from './__fixtures__/profile_device_valid.json';
import profile_device_data_valid from './__fixtures__/profile_device_data_valid.json';
import profile_app_data_invalid from './__fixtures__/profile_app_data_invalid.json';
import profile_device_data_invalid from './__fixtures__/profile_device_data_invalid.json';

import networkMessages_valid from './__fixtures__/NetworkMessages_valid.json';



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
const defaultTopic = `oi4/Registry/${defaultAppId}`;

function equal(a: string, b: string): boolean {
    if ((a == undefined|| a== null|| a.length==0) && (b==undefined || b==null|| b.length==0))
    {
        return true;
    }

    return a==b;
}

function validFixedResponse(getRequest: GetRequest, response: any): PubResponse
{
    // fixup correlationId in response:
    response.correlationId = getRequest.Message.MessageId; 

    return new PubResponse('', Buffer.from(JSON.stringify(response)));
}

function responseWrongCorrelationId(getRequest: GetRequest, response: any): PubResponse
{
    // set wrong correlationId
    response.correlationId = `${getRequest.Message.MessageId}abc`;  
    return new PubResponse('', Buffer.from(JSON.stringify(response)));
}

function responseWrongDataSetClassId(getRequest: GetRequest, response: any): PubResponse
{
    // set wrong correlationId
    response.DataSetClassId = 'C3ECB9BC-D021-4DB7-818B-41403BBA8449'; // enforce wrong DataSetClassId 
    
    // fixup correlationId
    response.correlationId = getRequest.Message.MessageId;  
    return new PubResponse('', Buffer.from(JSON.stringify(response)));
}


function validResponse(getRequest: GetRequest): PubResponse
{
    // search a matching response for the request:
    const responseTestObj = networkMessages_valid.find((entry) => equal(entry[0].resource, getRequest.Resource) && equal(entry[0].subResource, getRequest.SubResource));
    const responseObj = responseTestObj[1];

    // fixup correlationId in response:
    responseObj.correlationId = getRequest.Message.MessageId; 
    
    return  new PubResponse('', Buffer.from(JSON.stringify(responseObj)));
}

function getObjectUnderTest(returnFunc: (req: GetRequest) => PubResponse): ConformityValidator
{
    const mqttClient = getMqttClient();

    publish.mockImplementation(async (request: GetRequest) => {

        const pubResponse = returnFunc(request);
        return Promise.resolve(pubResponse);
    });
  
    const messageBusLookup: IMessageBusLookup = {
        getMessage: publish,
    }
   
    return new ConformityValidator(defaultAppId, mqttClient, messageBusLookup);
}


interface TestData
{
    resource: string;
    oi4Identifier: string;
    subResource: string;
}


describe('Unit test for ConformityValidator ', () => {

    beforeEach(()=> {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });


    it('should return full device conformity' , async ()=> {

        const objectUnderTest = getObjectUnderTest((req: GetRequest)=> validResponse(req));
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
    });
     

    it.each(networkMessages_valid)(
        '(%#) should return full conformity for -> %j',
        async (testData: TestData, obj: any) => {
            const resourceString: string = testData.resource;
            const resource: Resource = getResource(resourceString);
            const topicPreamble = `oi4/Registry/${testData.oi4Identifier}`;
            const subResource: string = testData.subResource; 

            const objectUnderTest = getObjectUnderTest((req: GetRequest)=> validFixedResponse(req, obj));
            const result = await objectUnderTest.checkResourceConformity(topicPreamble, resource, subResource);

            const getTopic: string = subResource.length == 0 ? `${topicPreamble}/get/${resourceString}` : `${topicPreamble}/get/${resourceString}/${subResource}`;
            const pubTopic: string = subResource.length == 0 ? `${topicPreamble}/pub/${resourceString}` : `${topicPreamble}/pub/${resourceString}/${subResource}`;

            expect(result.validity).toBe(EValidity.ok);
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${resourceString} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${resourceString} from ${pubTopic}.`, ESyslogEventFilter.warning);
        }
      )

      it.each(networkMessages_valid)(
        '(%#) should return partial conformity for wrong correlationId -> %j',
        async (testData: TestData, obj: any) => {
            const resourceString: string = testData.resource;
            const resource: Resource = getResource(resourceString);
            const topicPreamble = `oi4/Registry/${testData.oi4Identifier}`;
            const subResource: string = testData.subResource; 


            const objectUnderTest = getObjectUnderTest((req: GetRequest)=> responseWrongCorrelationId(req, obj));
            const result = await objectUnderTest.checkResourceConformity(topicPreamble, resource, subResource);

            const getTopic: string = subResource.length == 0 ? `${topicPreamble}/get/${resourceString}` : `${topicPreamble}/get/${resourceString}/${subResource}`;
            const pubTopic: string = subResource.length == 0 ? `${topicPreamble}/pub/${resourceString}` : `${topicPreamble}/pub/${resourceString}/${subResource}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(LOGGER.log).toHaveBeenCalledTimes(3);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${resourceString} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${resourceString} from ${pubTopic}.`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`CorrelationId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
      )


      it.each(networkMessages_valid)(
        '(%#) should return partial conformity for wrong DataSetId -> %j',
        async (testData: TestData, obj: any) => {
            const resourceString: string = testData.resource;
            const resource: Resource = getResource(resourceString);
            const topicPreamble = `oi4/Registry/${testData.oi4Identifier}`;
            const subResource: string = testData.subResource; 


            const objectUnderTest = getObjectUnderTest((req: GetRequest)=> responseWrongDataSetClassId(req, obj));
            const result = await objectUnderTest.checkResourceConformity(topicPreamble, resource, subResource);

            const getTopic: string = subResource.length == 0 ? `${topicPreamble}/get/${resourceString}` : `${topicPreamble}/get/${resourceString}/${subResource}`;
            const pubTopic: string = subResource.length == 0 ? `${topicPreamble}/pub/${resourceString}` : `${topicPreamble}/pub/${resourceString}/${subResource}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(LOGGER.log).toHaveBeenCalledTimes(3);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource ${resourceString} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on ${resourceString} from ${pubTopic}.`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`DataSetClassId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
      )


    it.each([profile_app_valid, profile_app_data_valid])(
        '(%#) should return full conformity for application profile -> %s',
        async (obj) => {
            const objectUnderTest = getObjectUnderTest((req: GetRequest)=> validFixedResponse(req, obj));
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
            const objectUnderTest = getObjectUnderTest((req: GetRequest)=> validFixedResponse(req, obj));
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.device);
            expect(result.validity).toBe(EValidity.ok);
    
            expect(LOGGER.log).toHaveBeenCalledTimes(2);
            expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
            expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
        }
      )

      it('should return partial conformity for application profile with missing metadata', async ()=> {

        const objectUnderTest = getObjectUnderTest((req: GetRequest) => validFixedResponse(req, profile_app_data_invalid));
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "data" but not "metadata".');

        expect(LOGGER.log).toHaveBeenCalledTimes(2);
        expect(LOGGER.log).toHaveBeenCalledWith(`Trying to validate resource profile on ${defaultTopic}/get/profile (Low-Level).`, ESyslogEventFilter.warning);
        expect(LOGGER.log).toHaveBeenCalledWith(`Received conformity message on profile from ${defaultTopic}/pub/profile.`, ESyslogEventFilter.warning);
    })

    it('should return partial conformity for device profile with missing metadata', async ()=> {

        const objectUnderTest = getObjectUnderTest((req: GetRequest)=> validFixedResponse(req, profile_device_data_invalid));
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