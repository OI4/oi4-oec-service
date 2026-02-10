import mqtt = require('async-mqtt');
import {ConformityValidator, EValidity} from '../src';
import {GetRequest, IMessageBusLookup, PubResponse} from '../src/model/IMessageBusLookup';
import {logger} from '@oi4/oi4-oec-service-logger';
import {
    EAssetType,
    ESyslogEventFilter,
    Methods,
    Resources,
    Oi4Identifier,
    ServiceTypes,
    oi4Namespace
} from '@oi4/oi4-oec-service-model';

import mam_valid from './__fixtures__/mam_valid.json';
import health_valid from './__fixtures__/health_valid.json';
import publicationList_valid from './__fixtures__/publicationList_valid.json';
import subscriptionList_valid from './__fixtures__/subscriptionList_valid.json';
import data_valid from './__fixtures__/data_valid.json';
import metadata_valid from './__fixtures__/metadata_valid.json';
import referenceDesignation_valid from './__fixtures__/referenceDesignation_valid.json';
import config_valid from './__fixtures__/config_valid.json';
import event_valid from './__fixtures__/event_valid.json';

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
        logger: {
            log: jest.fn(),
        },
        initializeLogger: jest.fn(),
    })
)

interface ITestData {
    resource: Resources;
    dataSetWriterName?: string;
    writerGroupName?: string;
    message: any;
}

const addFilter = (data: ITestData): string => {
    return data.writerGroupName ? `/${data.writerGroupName}` : '';
};

const getMqttClient = (): mqtt.AsyncClient => {
    return {
        connected: true,
        publish: jest.fn(),
    } as unknown as mqtt.AsyncClient;
}

const defaultAppId = Oi4Identifier.fromString('openindustry4.com/nd/nd/nd');
const defaultSource = Oi4Identifier.fromString('vendor.com/a/b/c');
const defaultTopic = `${oi4Namespace}/Registry/${defaultAppId}`;

function equal(a: string, b: string): boolean {
    if ((a == undefined || a.length == 0) && (b == undefined || b.length == 0)) {
        return true;
    }

    return a == b;
}

function getSource(data: ITestData): Oi4Identifier | undefined {
    return data.dataSetWriterName == undefined ? undefined : Oi4Identifier.fromString(data.dataSetWriterName);
}

const validDeviceTestData: ITestData[] = [
    {resource: Resources.MAM, message: mam_valid},
    {resource: Resources.HEALTH, message: health_valid},
    {resource: Resources.PROFILE, message: profile_app_valid},
    {resource: Resources.PUBLICATION_LIST, message: publicationList_valid},
    {resource: Resources.SUBSCRIPTION_LIST, message: subscriptionList_valid},
    {resource: Resources.REFERENCE_DESIGNATION, message: referenceDesignation_valid},
    {resource: Resources.DATA, message: data_valid},
    {resource: Resources.CONFIG, message: config_valid},
    {resource: Resources.EVENT, message: event_valid, dataSetWriterName: defaultSource.toString(), writerGroupName: 'Status/Good'}];

const allValidDeviceTestData: ITestData[] = validDeviceTestData.concat([
    {resource: Resources.METADATA, message: metadata_valid}]);


function getObjectUnderTest(response: ITestData[] = [], fixReplyTo = true): ConformityValidator {
    const mqttClient = getMqttClient();

    publish.mockImplementation(async (request: GetRequest) => {

        const responseEntry = response.find((entry) =>
            entry.resource == request.Resource &&
            equal(entry.dataSetWriterName, request.Source?.toString()) &&
            equal(entry.writerGroupName, request.Filter));
        const message = responseEntry.message;

        if (fixReplyTo) {
            const decodedMessage = JSON.parse(request.JsonMessage);
            message.ReplyTo = decodedMessage.MessageId;
        }

        //const req = request.Resource === Resources.EVENT ? new GetRequest(request.TopicPreamble, request.Resource, request.Message, responseEntry.source, 'Status/Good') : request;

        return new PubResponse(request.getTopic(Methods.PUB), Buffer.from(JSON.stringify(message)));

    });

    const messageBusLookup: IMessageBusLookup = {
        getMessage: publish,
    }

    return new ConformityValidator(defaultAppId, mqttClient, ServiceTypes.REGISTRY, messageBusLookup);
}

describe('Unit test for ConformityValidator ', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });


    it('should return conformity for all types of resources', async () => {

        const applicationMessages: ITestData[] = [
            {resource: Resources.MAM, message: mam_valid},
            {resource: Resources.HEALTH, message: health_valid},
            {resource: Resources.PROFILE, message: profile_full_valid},
            {resource: Resources.PUBLICATION_LIST, message: publicationList_valid},
            {resource: Resources.CONFIG, message: config_valid},
            {resource: Resources.REFERENCE_DESIGNATION, message: referenceDesignation_valid},
            {resource: Resources.EVENT, message: event_valid},
            {resource: Resources.DATA, message: data_valid},
            {
                resource: Resources.METADATA,
                dataSetWriterName: 'openindustry4.com/nd/nd/nd',
                writerGroupName: 'oee',
                message: metadata_valid
            },
            {resource: Resources.SUBSCRIPTION_LIST, message: subscriptionList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        let result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic, undefined, applicationMessages.map(resource => resource.resource));
        result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic, undefined, applicationMessages.map(resource => resource.resource));

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resources['MAM'].validity).toBe(EValidity.ok);
        expect(result.resources['Health'].validity).toBe(EValidity.ok);
        expect(result.resources['Profile'].validity).toBe(EValidity.ok);
        expect(result.resources['PublicationList'].validity).toBe(EValidity.ok);
        expect(result.resources['Config'].validity).toBe(EValidity.ok);
        expect(result.resources['ReferenceDesignation'].validity).toBe(EValidity.ok);
        expect(result.resources['Event'].validity).toBe(EValidity.default);
        expect(result.resources['Event'].validityErrors).toContain('Resource result ignored, ok');
        expect(result.resources['Data'].validity).toBe(EValidity.ok);
        expect(result.resources['Metadata'].validity).toBe(EValidity.ok);
        expect(result.resources['SubscriptionList'].validity).toBe(EValidity.ok);
        expect(result.checkedResourceList.length).toEqual(14)
    });


    it('should return full application conformity', async () => {

        const applicationMessages: ITestData[] = [
            {resource: Resources.MAM, message: mam_valid},
            {resource: Resources.HEALTH, message: health_valid},
            {resource: Resources.PROFILE, message: profile_app_valid},
            {resource: Resources.PUBLICATION_LIST, message: publicationList_valid}
        ]

        const objectUnderTest = getObjectUnderTest(applicationMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.application, defaultTopic);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resources['MAM'].validity).toBe(EValidity.ok);
        expect(result.resources['Health'].validity).toBe(EValidity.ok);
        expect(result.resources['Profile'].validity).toBe(EValidity.ok);
        expect(result.resources['PublicationList'].validity).toBe(EValidity.ok);
        expect(result.checkedResourceList.sort()).toEqual([Resources.HEALTH, Resources.MAM, Resources.PROFILE, Resources.PUBLICATION_LIST])
    });

    it('should return full device conformity', async () => {
        const sourceString = defaultSource.toString();
        const deviceMessages: ITestData[] = [
            {resource: Resources.MAM, dataSetWriterName: sourceString, message: mam_valid},
            {resource: Resources.HEALTH, dataSetWriterName: sourceString, message: health_valid},
            {resource: Resources.PROFILE, dataSetWriterName: sourceString, message: profile_device_valid},
            {resource: Resources.REFERENCE_DESIGNATION, dataSetWriterName: sourceString, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSource);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.profileResourceList.sort()).toEqual([Resources.HEALTH, Resources.MAM, Resources.PROFILE, Resources.REFERENCE_DESIGNATION])
    });

    it('should detect unknown resource in profile', async () => {
        const sourceString = defaultSource.toString();
        const deviceMessages: ITestData[] = [
            {resource: Resources.MAM, dataSetWriterName: sourceString, message: mam_valid},
            {resource: Resources.HEALTH, dataSetWriterName: sourceString, message: health_valid},
            {resource: Resources.PROFILE, dataSetWriterName: sourceString, message: profile_device_unknown_resource},
            {resource: Resources.REFERENCE_DESIGNATION, dataSetWriterName: sourceString, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSource);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.resources['unknown'].validity).toBe(EValidity.nok);
        expect(result.resources['unknown'].validityErrors).toContain('Resource is unknown to OI4');
    });

    it('should return partial device conformity if health is wrong', async () => {
        const sourceString = defaultSource.toString();
        const deviceMessages: ITestData[] = [
            {resource: Resources.MAM, dataSetWriterName: sourceString, message: mam_valid},
            {resource: Resources.HEALTH, dataSetWriterName: sourceString, message: mam_valid}, // return mam for health
            {resource: Resources.PROFILE, dataSetWriterName: sourceString, message: profile_device_valid},
            {resource: Resources.REFERENCE_DESIGNATION, dataSetWriterName: sourceString, message: referenceDesignation_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSource);

        expect(result.validity).toBe(EValidity.partial);
        expect(result.resources['MAM'].validity).toBe(EValidity.ok);
        expect(result.resources['Health'].validity).toBe(EValidity.partial);
        expect(result.resources['Profile'].validity).toBe(EValidity.ok);
        expect(result.resources['ReferenceDesignation'].validity).toBe(EValidity.ok);
        expect(logger.log).toHaveBeenCalledWith(`Schema validation of message ${defaultTopic}/Pub/Health/${defaultSource} was not successful.`, ESyslogEventFilter.error);
    });

    it('should detect missing meta data', async () => {
        const sourceString = defaultSource.toString();
        const deviceMessages: ITestData[] = [
            {resource: Resources.MAM, dataSetWriterName: sourceString, message: mam_valid},
            {resource: Resources.HEALTH, dataSetWriterName: sourceString, message: health_valid},
            {resource: Resources.PROFILE, dataSetWriterName: sourceString, message: profile_device_data_valid},
            {resource: Resources.REFERENCE_DESIGNATION, dataSetWriterName: sourceString, message: referenceDesignation_valid},
            {resource: Resources.DATA, dataSetWriterName: sourceString, message: data_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSource);

        expect(result.validity).toBe(EValidity.partial);
        expect(result.resources['Metadata'].validity).toBe(EValidity.nok);
    });

    it('should validate meta data conformity', async () => {

        const messages: ITestData[] = [
            {resource: Resources.METADATA, dataSetWriterName: defaultSource.toString(), message: metadata_valid},
        ]

        const objectUnderTest = getObjectUnderTest(messages);
        const result = await objectUnderTest.checkMetaDataConformity(defaultTopic, defaultSource, '');

        expect(result.validity).toBe(EValidity.ok);
    });

    it('should evaluate additional resources not included in the profile', async () => {
        const sourceString = defaultSource.toString();
        const deviceMessages: ITestData[] = [
            {resource: Resources.MAM, dataSetWriterName: sourceString, message: mam_valid},
            {resource: Resources.HEALTH, dataSetWriterName: sourceString, message: health_valid},
            {resource: Resources.PROFILE, dataSetWriterName: sourceString, message: profile_device_valid},
            {resource: Resources.REFERENCE_DESIGNATION, dataSetWriterName: sourceString, message: referenceDesignation_valid},
            {resource: Resources.CONFIG, dataSetWriterName: sourceString, message: config_valid}
        ]

        const objectUnderTest = getObjectUnderTest(deviceMessages);
        const result = await objectUnderTest.checkConformity(EAssetType.device, defaultTopic, defaultSource, [Resources.CONFIG]);

        expect(result.validity).toBe(EValidity.ok);
        expect(result.profileResourceList.sort()).toEqual([Resources.HEALTH, Resources.MAM, Resources.PROFILE, Resources.REFERENCE_DESIGNATION])
        expect(result.nonProfileResourceList).toEqual([Resources.CONFIG])
        expect(result.resources[Resources.CONFIG]?.validity).toBe(EValidity.ok);
    });

    it.each(allValidDeviceTestData)(
        '($#) should return full resource conformity for -> $resource',
        async (data: ITestData) => {

            const objectUnderTest = getObjectUnderTest([data]);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, getSource(data), data.writerGroupName);

            const getTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Get/${data.resource}` : `${defaultTopic}/Get/${data.resource}/${data.dataSetWriterName}${addFilter(data)}`;
            const pubTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Pub/${data.resource}` : `${defaultTopic}/Pub/${data.resource}/${data.dataSetWriterName}${addFilter(data)}`;

            expect(result.validity).toBe(EValidity.ok);
            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.debug);
        }
    )

    it.each(allValidDeviceTestData)(
        '($#) should return partial conformity for wrong replyTo -> $resource',
        async (data: ITestData) => {
            const objectUnderTest = getObjectUnderTest([data], false);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, getSource(data), data.writerGroupName);

            const getTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Get/${data.resource}` : `${defaultTopic}/Get/${data.resource}/${data.dataSetWriterName}${addFilter(data)}`;
            const pubTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Pub/${data.resource}` : `${defaultTopic}/Pub/${data.resource}/${data.dataSetWriterName}${addFilter(data)}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(logger.log).toHaveBeenCalledTimes(3);
            expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`ReplyTo did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
    )


    it.each(validDeviceTestData)(
        '($#) should return partial conformity for wrong DataSetId -> $resource',
        async (data: ITestData) => {

            // clone message:
            const clonedMessage = JSON.stringify(data.message);
            const message = JSON.parse(clonedMessage);
            message.DataSetClassId = 'C3ECB9BC-D021-4DB7-818B-41403BBA8449'; // enforce wrong DataSetClassId

            const objectUnderTest = getObjectUnderTest([{
                resource: data.resource,
                message: message,
                dataSetWriterName: data.dataSetWriterName,
                writerGroupName: data.writerGroupName
            }]);
            const result = await objectUnderTest.checkResourceConformity(defaultTopic, data.resource, getSource(data), data.writerGroupName);

            const addFilter = (): string => {
                return data.writerGroupName ? `/${data.writerGroupName}` : '';
            };

            const getTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Get/${data.resource}` : `${defaultTopic}/Get/${data.resource}/${data.dataSetWriterName}${addFilter()}`;
            const pubTopic: string = data.dataSetWriterName == undefined ? `${defaultTopic}/Pub/${data.resource}` : `${defaultTopic}/Pub/${data.resource}/${data.dataSetWriterName}${addFilter()}`;

            expect(result.validity).toBe(EValidity.partial);
            expect(logger.log).toHaveBeenCalledTimes(3);
            expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource ${data.resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`Received conformity message on ${data.resource} from ${pubTopic}.`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`DataSetClassId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
        }
    )

    it.each([profile_app_valid, profile_app_data_valid])(
        '($#) should return full conformity for application profile',
        async (obj) => {
            const objectUnderTest = getObjectUnderTest([{resource: Resources.PROFILE, message: obj}]);
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
            expect(result.validity).toBe(EValidity.ok);

            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource Profile on ${defaultTopic}/Get/Profile (Low-Level).`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`Received conformity message on Profile from ${defaultTopic}/Pub/Profile.`, ESyslogEventFilter.debug);
        }
    )

    it.each([profile_device_valid, profile_device_data_valid])(
        '($#) should return full conformity for device profile',
        async (obj) => {
            const objectUnderTest = getObjectUnderTest([{resource: Resources.PROFILE, message: obj}]);
            const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.device);
            expect(result.validity).toBe(EValidity.ok);

            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource Profile on ${defaultTopic}/Get/Profile (Low-Level).`, ESyslogEventFilter.debug);
            expect(logger.log).toHaveBeenCalledWith(`Received conformity message on Profile from ${defaultTopic}/Pub/Profile.`, ESyslogEventFilter.debug);
        }
    )

    it('should return partial conformity for application profile with missing metadata', async () => {

        const objectUnderTest = getObjectUnderTest([{resource: Resources.PROFILE, message: profile_app_data_invalid}]);
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "Data" but not "Metadata".');

        expect(logger.log).toHaveBeenCalledTimes(2);
        expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource Profile on ${defaultTopic}/Get/Profile (Low-Level).`, ESyslogEventFilter.debug);
        expect(logger.log).toHaveBeenCalledWith(`Received conformity message on Profile from ${defaultTopic}/Pub/Profile.`, ESyslogEventFilter.debug);
    })

    it('should return partial conformity for device profile with missing metadata', async () => {

        const objectUnderTest = getObjectUnderTest([{
            resource: Resources.PROFILE,
            message: profile_device_data_invalid
        }]);
        const result = await objectUnderTest.checkProfileConformity(defaultTopic, EAssetType.application);
        expect(result.validity).toBe(EValidity.partial);
        expect(result.validityErrors).toContain('Profile contains the resource "Data" but not "Metadata".');

        expect(logger.log).toHaveBeenCalledTimes(2);
        expect(logger.log).toHaveBeenCalledWith(`Trying to validate resource Profile on ${defaultTopic}/Get/Profile (Low-Level).`, ESyslogEventFilter.debug);
        expect(logger.log).toHaveBeenCalledWith(`Received conformity message on Profile from ${defaultTopic}/Pub/Profile.`, ESyslogEventFilter.debug);
    })

    it.each(allValidDeviceTestData)(
        '($#) should return full schema conformity for -> $resource',
        async (data: ITestData) => {
            const objectUnderTest = getObjectUnderTest();
            const result = await objectUnderTest.checkSchemaConformity(data.resource, data.message);

            expect(result.schemaResult).toBe(true);
        }
    )

    it('should return mandatory application resources', () => {
        const resources = ConformityValidator.getMandatoryResources(EAssetType.application);
        expect([Resources.MAM, Resources.HEALTH, Resources.PROFILE, Resources.PUBLICATION_LIST].sort()).toEqual(resources.sort());
    })

    it('should return mandatory device resources', () => {
        const resources = ConformityValidator.getMandatoryResources(EAssetType.device);
        expect([Resources.MAM, Resources.HEALTH, Resources.PROFILE, Resources.REFERENCE_DESIGNATION].sort()).toEqual(resources.sort());

    })


    it('should check oi4 conformity', async () => {
        const result = await ConformityValidator.checkOi4IdConformity(defaultAppId);
        expect(result).toBe(true);
    })
});
