import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EValidity, IConformity, ISchemaConformity, IValidityDetails} from './model/IConformityValidator';
import {IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {
    Application,
    buildOecJsonValidator,
    DataSetClassIds,
    Device,
    EAssetType,
    ESyslogEventFilter,
    Resource
} from '@oi4/oi4-oec-service-model';

// Resource imports
import Ajv from 'ajv'; /*tslint:disable-line*/
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {serviceTypeSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {MessageBusLookup} from './Helper/MessageBusLookup';
import {IMessageBusLookup, GetRequest} from './model/IMessageBusLookup';

export * from './model/IConformityValidator';

/**
 * Responsible for checking mandatory OI4-conformance.
 * Only checks for response within a certain amount of time, not for 100% payload conformity.
 * TODO: Improve JSON Schema checks!
 */
export class ConformityValidator {
    private readonly conformityClient: mqtt.AsyncClient;
    private readonly messageBusLookup: IMessageBusLookup;
    private builder: OPCUABuilder;
    private readonly jsonValidator: Ajv.Ajv;
    static completeProfileList: string[] = Application.full;
    static readonly serviceTypes = serviceTypeSchemaJson.enum;

    constructor(oi4Id: string, mqttClient: mqtt.AsyncClient, messageBusLookup: IMessageBusLookup = new MessageBusLookup(mqttClient), oecJsonValidator = buildOecJsonValidator()) {
        this.jsonValidator = oecJsonValidator;
        this.conformityClient = mqttClient;
        this.messageBusLookup = messageBusLookup;

        initializeLogger(true, 'ConformityValidator-App', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, this.conformityClient, oi4Id, 'Registry');
        this.builder = new OPCUABuilder(oi4Id, 'Registry'); // TODO: Set oi4Id to something useful
    }

    /**
     * A huge function with a simple purpose: Initialize a validity object with NOK values.
     * The validator functions set the individual tested methods to OK. Anything not set to OK remains in a failed state.
     */
    static initializeValidityObject(): IConformity {
        return {
            oi4Id: EValidity.default,
            validity: EValidity.default,
            resource: {},
            checkedResourceList: [],
            profileResourceList: [],
            nonProfileResourceList: [],
        };
    }

    /**
     * Check conformity of every resource in the variable resourceList.
     * If a resource passes, its entry in the conformity Object is set to 'OK', otherwise, the initialized 'NOK' values persist.
     * @param topicPreamble - The entire topic used to check conformity. 
     * @param assetType - Determines whether the asset is an application or an device.
     * @param subResource - The subResource.
     * @param resourceList - Additional resources for which conformity shall be checked. Leave empty in case that only mandatory resources shall be checked.
     */
    async checkConformity(assetType: EAssetType, topicPreamble: string, subResource: string, resourceList?: Resource[]): Promise<IConformity> {
        const ignoredResources = ['data', 'metadata', 'event'];
        const mandatoryResourceList = ConformityValidator.getMandatoryResources(assetType);
        LOGGER.log(`MandatoryResourceList of tested Asset: ${mandatoryResourceList}`, ESyslogEventFilter.warning);

        const conformityObject = ConformityValidator.initializeValidityObject();
        let errorSoFar = false;
        const licenseList: string[] = [];
        let oi4Result;
        let resObj: IValidityDetails; // Container for validation results

        try {
            oi4Result = await ConformityValidator.checkOI4IDConformity(subResource);
        } catch (err) {
            LOGGER.log(`OI4-ID of the tested asset does not match the specified format: ${err}`, ESyslogEventFilter.error);
            return conformityObject;
        }

        if (!oi4Result) {
            LOGGER.log('OI4-ID of the tested asset does not match the specified format', ESyslogEventFilter.error);
            return conformityObject;
        }

        conformityObject.oi4Id = EValidity.ok; // If we got past the oi4Id check, we can continue with all resources.

        try {
            conformityObject.resource['profile'] = await this.checkProfileConformity(topicPreamble, assetType, subResource);
        } catch (e) { // Profile did not return, we fill a dummy conformity entry so that we can continue checking the asset...
            conformityObject.resource['profile'] = {
                dataSetMessages: [{
                    Payload: {
                        resource: [], // Timeout = no resources
                    }
                }],
                validity: EValidity.nok,
                validityErrors: ['Timeout on Resource'],
            };
        }

        // First, all mandatories
        const checkedList: Resource[] = Object.assign([], mandatoryResourceList); // TODO cfz: clone list ok?
        try {
            // Second, all resources actually stored in the profile (Only oi4-conform profile entries will be checked)
            for (const resources of conformityObject.resource.profile.dataSetMessages[0].Payload.resource) {
                // The following lines are for checking whether there are some conform entries in the profile *additionally* to the mandatory ones
                if (!(checkedList.includes(resources))) { // Don't add resources twice
                    if (ConformityValidator.completeProfileList.includes(resources)) { // Second condition is for checking if the profile event meets OI4-Standards
                        checkedList.push(resources);
                    } else { // If we find resource which are not part of the oi4 standard, we don't check them but we mark them as an error
                        conformityObject.resource[resources] = {
                            dataSetMessages: [{}],
                            validity: EValidity.nok,
                            validityErrors: ['Resource is unknown to oi4'],
                        };
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }


        // Third, if a resourceList is specified, add those to our resources to be checked
        if (resourceList) {
            console.log(`Got ResourceList from Param: ${resourceList}`);
            for (const resources of resourceList) {
                if (!(checkedList.includes(resources))) {
                    checkedList.push(resources);
                    conformityObject.nonProfileResourceList.push(resources);
                }
            }
        }

        conformityObject.checkedResourceList = checkedList;

        resObj = { // ResObj Initialization before checking all Resources
            validity: EValidity.default,
            validityErrors: ['You should not see this in prod, initialization dummy obj'],
            dataSetMessages: [{}],
        };

        // Actually start checking the resources
        for (const resource of checkedList) {
            LOGGER.log(`Checking Resource ${resource} (High-Level)`, ESyslogEventFilter.informational);
            try {
                if (resource === 'profile') continue; // We already checked profile
                if (resource === 'license') { // License is a different case. We actually need to parse the return value here
                    resObj = await this.checkResourceConformity(topicPreamble, resource) as IValidityDetails;
                    for (const payload of resObj.dataSetMessages) {
                        if (typeof payload.Payload.page !== 'undefined') {
                            LOGGER.log('Careful, weve got pagination in license!');
                        } else {
                            licenseList.push(payload.POI) // With the obtained licenses, we can check the licenseText resource per TC-T6
                        }
                    }
                } else if (resource === 'licenseText') {
                    for (const licenses of licenseList) {
                        resObj = await this.checkResourceConformity(topicPreamble, resource, licenses) as IValidityDetails; // here, the oi4ID is the license
                    }
                } else {
                    if (resource === 'publicationList' || resource === 'subscriptionList' || resource === 'config') {
                        resObj = await this.checkResourceConformity(topicPreamble, resource) as IValidityDetails;
                    } else {
                        resObj = await this.checkResourceConformity(topicPreamble, resource, subResource) as IValidityDetails;
                    }
                }
            } catch (err) {
                LOGGER.log(`${resource} did not pass check with ${err}`, ESyslogEventFilter.error);
                resObj = {
                    validity: EValidity.nok,
                    validityErrors: [err],
                    dataSetMessages: [{}],
                };
                if (!ignoredResources.includes(resource)) {
                    errorSoFar = true;
                }
            }

            if (resObj.validity === EValidity.ok || resObj.validity === EValidity.default) { // Set the validity according to the results
                conformityObject.resource[resource] = resObj;
            } else if (resObj.validity === EValidity.partial) {
                if (ignoredResources.includes(resource)) {
                    resObj.validity = EValidity.default;
                    resObj.validityErrors = ['Resource result ignored, ok'];
                } else {
                    errorSoFar = true;
                }
            } else if (resObj.validity === EValidity.nok) {
                if (ignoredResources.includes(resource)) {
                    resObj.validity = EValidity.default;
                    resObj.validityErrors = ['Resource result ignored, ok'];
                } else {
                    errorSoFar = true;
                }
            }

            // Finally, assign the temporary ResObj to the conformityObject
            conformityObject.resource[resource] = {
                validity: resObj.validity,
                validityErrors: resObj.validityErrors,
                dataSetMessages: resObj.dataSetMessages,
            };
        }

        if (errorSoFar) { // If we had any error so far, the entire validity is at least "partial"
            conformityObject.validity = EValidity.partial;
        } else {
            conformityObject.validity = EValidity.ok;
        }

        LOGGER.log(`Final conformity object: ${JSON.stringify(conformityObject)}`, ESyslogEventFilter.debug);

        // Convert to old style:
        return conformityObject;
    }

    /**
     * Since the simple resource check does not check for additional logic, we implement those checks here
     * 1) The profile payload needs to contain the mandatory resources for its asset type
     * 2) The profile payload should not contain additional resources to the ones specified in the oi4 guideline
     * 3) Every resource that is specified in the profile payload needs to be accessible (exceptions for data, metadata, event)
     * Sidenote: "Custom" Resources will be marked as an error and not checked
     * @param topicPreamble The fullTopic that is used to check the get-route
     * @param oi4Id  The oidId of the tested asset ("tag element")
     * @param assetType The type of asset being tested (device / application)
     * @returns {IValidityDetails} A validity object containing information about the conformity of the profile resource
     */

    async checkProfileConformity(topicPreamble: string, assetType: EAssetType, subResource?: string, filter?: string): Promise<IValidityDetails> {
        let resObj: IValidityDetails;

        try {
            resObj = await this.checkResourceConformity(topicPreamble, Resource.PROFILE, subResource, filter);
        } catch (e) {
            LOGGER.log(`Error in checkProfileConformity: ${e}`);
            throw e;
        }

        const profileDataSetMessage = resObj.dataSetMessages;
        const mandatoryResourceList = ConformityValidator.getMandatoryResources(assetType);
        const profilePayload = profileDataSetMessage[0].Payload;
        if (!(mandatoryResourceList.every(i => profilePayload.resource.includes(i)))) {
            resObj.validity = EValidity.partial;
            resObj.validityErrors.push('Not every mandatory in resource list of profile.');
        }

        if (profilePayload.resource.includes('data') && !profilePayload.resource.includes('metadata'))
        {
            resObj.validity = EValidity.partial;
            resObj.validityErrors.push('Profile contains the resource "data" but not "metadata".');
        }

        return resObj;
    }

    /**
     * Retrieves a list of resources which are considered mandatory according to assetType and
     * @param assetType The type that is used to retrieve the list of mandatory resources
     * @returns {string[]} A list of mandatory resources
     */
    static getMandatoryResources(assetType: EAssetType): Resource[] {
        let mandatoryResources: Resource[];
        if (assetType === EAssetType.application) {
            mandatoryResources = Application.mandatory;
        } else {
            mandatoryResources = Device.mandatory;
        }
        return mandatoryResources;
    }

    /**
     * Checks the conformity of a resource of an OI4-participant by publishing a /get/<resource> on the bus and expecting a response
     * within a certain timeframe. The response is then superficially checked for validity (mostly NetworkMessage structure) and for correlationID functionality.
     * (Rev06 states that the MessageID of a requestor is to be written to the correlationID of the answer).
     * If everything matches, an 'OK' response is returned.
     * If we receive an answer, but the payload / correlation ID is not conform, a 'Partial' response is returned.
     * If we don't receive an answer within the given timeframe, an error is returned.
     * @param topicPreamble - the originator oi4Id of the requestor
     * @param resource - the resource that is to be checked (health, license, etc...)
     * @param subResource - the subResource of the requestor, in most cases their oi4Id
     * @param filter - the filter (if available)
     */
    async checkResourceConformity(topicPreamble: string, resource: Resource, subResource?: string, filter?: string): Promise<IValidityDetails> {
        
        const conformityPayload = this.builder.buildOPCUANetworkMessage([], new Date, DataSetClassIds[resource]);
        const getRequest = new GetRequest(topicPreamble, resource, conformityPayload, subResource, filter);

        const getTopic = getRequest.getTopic('get');
        const pubTopic = getRequest.getTopic('pub');
        
        LOGGER.log(`Trying to validate resource ${resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
        const response = await this.messageBusLookup.getMessage(getRequest);
        LOGGER.log(`Received conformity message on ${resource} from ${pubTopic}.`, ESyslogEventFilter.warning);

        const errorMsgArr = [];
        const parsedMessage = JSON.parse(response.RawMessage.toString()) as IOPCUANetworkMessage;
        let eRes: number;
        const schemaResult: ISchemaConformity = await this.checkSchemaConformity(resource, parsedMessage);
        if (schemaResult.schemaResult) { // Check if the schema validator threw any faults, schemaResult is an indicator for overall faults
            if (parsedMessage.correlationId === conformityPayload.MessageId) { // Check if the correlationId matches our messageId (according to guideline)
                eRes = EValidity.ok;
            } else {
                eRes = EValidity.partial;
                errorMsgArr.push(`CorrelationId did not pass for ${pubTopic}.`);
                LOGGER.log(`CorrelationId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
            }
        } else { // Oops, we have schema erros, let's show them to the user so they can fix them...
            LOGGER.log(`Schema validation of message ${pubTopic} was not successful.`, ESyslogEventFilter.error);
            errorMsgArr.push('Some issue with schema validation, read further array messages');
            if (!(schemaResult.networkMessage.schemaResult)) { // NetworkMessage seems wrong
                LOGGER.log('NetworkMessage wrong', ESyslogEventFilter.warning);
                errorMsgArr.push(...schemaResult.networkMessage.resultMsgArr);
            }
            if (!(schemaResult.payload.schemaResult)) { // Payload seems wrong
                LOGGER.log('Payload wrong', ESyslogEventFilter.warning);
                errorMsgArr.push(...schemaResult.payload.resultMsgArr);
            }

            eRes = EValidity.partial;
        }

        if (!(parsedMessage.DataSetClassId === DataSetClassIds[resource])) { // Check if the dataSetClassId matches our development guideline
            LOGGER.log(`DataSetClassId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
            errorMsgArr.push(`DataSetClassId did not pass for ${pubTopic}.`);
            eRes = EValidity.partial;
        }

        let resPayloadArr;
        if (parsedMessage.MessageType === 'ua-data') {
            resPayloadArr = parsedMessage.Messages;
        } else {
            resPayloadArr = ['metadata'];
        }

        const resObj: IValidityDetails = {
            validity: eRes,
            validityErrors: errorMsgArr,
            dataSetMessages: resPayloadArr, // We add the payload here in case we need to parse it later on (profile, licenseText for exmaple)
        };

        return resObj;
    }

    /**
     * Checks the conformity of the payload by testing it against the correct schemas using the ajv library
     * Both the networkmessage and the actual payload are tested and only return a positive result if both passed
     * @param resource The resource that is being checked
     * @param payload  The payload that is being checked
     * @returns true, if both the networkmessage and the payload fit the resource, false otherwise
     */
    async checkSchemaConformity(resource: string, payload: any): Promise<ISchemaConformity> {
        let networkMessageValidationResult;
        let payloadValidationResult = false;

        const networkMessageResultMsgArr: string[] = [];
        const payloadResultMsgArr: string[] = [];

        try {
            networkMessageValidationResult = await this.jsonValidator.validate('NetworkMessage.schema.json', payload);
        } catch (networkMessageValidationErr) {
            LOGGER.log(`AJV (Catch NetworkMessage): (${resource}):${networkMessageValidationErr}`, ESyslogEventFilter.error);
            networkMessageResultMsgArr.push(JSON.stringify(networkMessageValidationErr));
            networkMessageValidationResult = false;
        }

        if (!networkMessageValidationResult) {
            const errText = JSON.stringify(this.jsonValidator.errors);
            LOGGER.log(`AJV: NetworkMessage invalid (${resource}): ${JSON.stringify(errText)}`, ESyslogEventFilter.error);
            networkMessageResultMsgArr.push(errText);
        }

        if (networkMessageValidationResult) {
            if (payload.MessageType === 'ua-metadata') {
                payloadValidationResult = true; // We accept all metadata messages since we cannot check their contents
            } else { // Since it's a data message, we can check against schemas
                try {
                    for (const payloads of payload.Messages) {
                        payloadValidationResult = await this.jsonValidator.validate(`${resource}.schema.json`, payloads.Payload);
                        if (!payloadValidationResult) {
                            const paginationResult = await this.jsonValidator.validate('pagination.schema.json', payloads.Payload);
                            if (!paginationResult) break; // No need to further check messages, we already have an error
                            payloadValidationResult = true; // If it was a conform pagination object, we accept it
                        }
                    }
                } catch (payloadValidationErr) {
                    LOGGER.log(`AJV (Catch Payload): (${resource}):${payloadValidationErr}`, ESyslogEventFilter.error);
                    payloadResultMsgArr.push(JSON.stringify(payloadValidationErr));
                    payloadValidationResult = false;
                }
                if (!payloadValidationResult) {
                    const errText = JSON.stringify(this.jsonValidator.errors);
                    LOGGER.log(`AJV: Payload invalid (${resource}): ${errText}`, ESyslogEventFilter.error);
                    payloadResultMsgArr.push(errText);
                }
            }
        }

        const schemaConformity: ISchemaConformity = {
            schemaResult: false,
            networkMessage: {
                schemaResult: networkMessageValidationResult,
                resultMsgArr: networkMessageResultMsgArr,
            },
            payload: {
                schemaResult: payloadValidationResult,
                resultMsgArr: payloadResultMsgArr,
            },
        };

        if (networkMessageValidationResult && payloadValidationResult) {
            schemaConformity.schemaResult = true;
        } else {
            LOGGER.log('Faulty payload, see Conformity Result object for further information', ESyslogEventFilter.warning);
            console.log(schemaConformity);
        }

        return schemaConformity;
    }

    /**
     * Checks the full topic (including oi4/... preamble) for conformity.
     * @param topic - the full topic that is checked
     */
    static async checkTopicConformity(topic: string): Promise<boolean> {
        const topicArray = topic.split('/');
        if (topicArray.length >= 8) {
            let oi4String = '';
            for (let i = 0; i < 6; i = i + 1) {
                oi4String = `${oi4String}/${topicArray[i]}`;
            }
            if (!(ConformityValidator.serviceTypes.includes(topicArray[1]))) return false; // throw new Error('Unknown ServiceType');
            const oi4Id = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
            return await ConformityValidator.checkOI4IDConformity(oi4Id);
        } else { /*tslint:disable-line*/
            return false; // For minimum validity, we need oi4ID (length: 6) + method + method
        }
    }

    static async checkOI4IDConformity(oi4Id: string): Promise<boolean> {
        const oi4Array = oi4Id.split('/');
        if (oi4Array.length !== 4) return false; // throw new Error('Wrong number of subTopics');
        // further checks will follow!
        const oi4RegEx = new RegExp(/^(([a-z0-9-]+\.)*([a-z0-9-]*)(?:\/[^\/`\\^\r\n]+){3})$/g);
        if (oi4RegEx.test(oi4Id)) return true;
        console.log('Error in checkOI4IDConformity!');
        return false;
    }
}
