import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {EValidity, IConformity, ISchemaConformity, IValidityDetails} from './model/IConformityValidator';
import {
    Application,
    buildOecJsonValidator,
    DataSetClassIds,
    DataSetWriterIdManager,
    Device,
    EAssetType,
    ESyslogEventFilter,
    IOPCUADataSetMessage,
    IOPCUADataSetMetaData,
    IOPCUANetworkMessage,
    Methods,
    Oi4Identifier,
    OPCUABuilder,
    Resources,
    ServiceTypes
} from '@oi4/oi4-oec-service-model';

import Ajv from 'ajv'; /*tslint:disable-line*/
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {serviceTypeSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {MessageBusLookup} from './Helper/MessageBusLookup';
import {GetRequest, IMessageBusLookup} from './model/IMessageBusLookup';

export * from './model/IConformityValidator';

interface ItemRef {
    Source: string;
    Filter: string;
}

/**
 * Responsible for checking mandatory OI4-conformance.
 * Only checks for response within a certain amount of time, not for 100% payload conformity.
 */
export class ConformityValidator {
    private readonly conformityClient: mqtt.AsyncClient;
    private readonly messageBusLookup: IMessageBusLookup;
    private builder: OPCUABuilder;
    private readonly jsonValidator: Ajv.Ajv;
    static completeProfileList: Resources[] = Application.full;
    static readonly serviceTypes = serviceTypeSchemaJson.enum;

    constructor(oi4Id: Oi4Identifier, mqttClient: mqtt.AsyncClient, serviceType: ServiceTypes, messageBusLookup: IMessageBusLookup = new MessageBusLookup(mqttClient), oecJsonValidator = buildOecJsonValidator()) {
        this.jsonValidator = oecJsonValidator;
        this.conformityClient = mqttClient;
        this.messageBusLookup = messageBusLookup;

        const logLevel: ESyslogEventFilter = process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter | ESyslogEventFilter.warning;
        const publishingLevel = process.env.OI4_EDGE_EVENT_PUBLISHING_LEVEL ? process.env.OI4_EDGE_EVENT_PUBLISHING_LEVEL as ESyslogEventFilter : logLevel;

        initializeLogger(true, 'ConformityValidator-App', logLevel, publishingLevel, oi4Id, serviceType, this.conformityClient);

        // Ignore the maximumPackageSize argument of the builder, because we only use the builder to create ".../get/<Resources>" messages.
        // Such messages cannot be split into smaller messages and shall never exceed the maximum package size.
        this.builder = new OPCUABuilder(oi4Id, serviceType);
    }

    /**
     * A huge function with a simple purpose: Initialize a validity object with NOK values.
     * The validator functions set the individual tested methods to OK. Anything not set to OK remains in a failed state.
     */
    static initializeValidityObject(): IConformity {
        return {
            oi4Id: EValidity.default,
            validity: EValidity.default,
            resources: {},
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
     * @param source - The Source.
     * @param resourceList - Additional resources for which conformity shall be checked. Leave empty in case that only mandatory resources shall be checked.
     */
    async checkConformity(assetType: EAssetType, topicPreamble: string, source?: string, resourceList?: Resources[]): Promise<IConformity> {
        const mandatoryResourceList = ConformityValidator.getMandatoryResources(assetType);
        LOGGER.log(`MandatoryResourceList of tested Asset: ${mandatoryResourceList}`, ESyslogEventFilter.informational);

        const conformityObject = ConformityValidator.initializeValidityObject();
        let errorSoFar = false;
        let licenseList: ItemRef[] = [];
        let dataList: ItemRef[] = [];
        let resObj: IValidityDetails; // Container for validation results

        conformityObject.oi4Id = await this.checkOI4IDConformity(topicPreamble, source);
        if (conformityObject.oi4Id !== EValidity.ok) {
            return conformityObject;
        }
        // If we got past the oi4Id check, we can continue with all resources.

        try {
            conformityObject.resources[Resources.PROFILE] = await this.checkProfileConformity(topicPreamble, assetType, source);
            conformityObject.profileResourceList = conformityObject.resources.Profile.dataSetMessages[0].Payload.Resources;

        } catch (e) { // Profile did not return, we fill a dummy conformity entry so that we can continue checking the asset...
            conformityObject.resources[Resources.PROFILE] = {
                dataSetMessages: [],
                validity: EValidity.nok,
                validityErrors: ['Timeout on Resource'],
            };
        }

        // First, all mandatories
        const checkList: Resources[] = Object.assign([], mandatoryResourceList);
        try {
            // Second, all resources actually stored in the profile (Only oi4-conform profile entries will be checked)
            for (const resource of conformityObject.profileResourceList) {
                // The following lines are for checking whether there are some conform entries in the profile *additionally* to the mandatory ones
                if (!(checkList.includes(resource))) { // Don't add resources twice
                    if (ConformityValidator.completeProfileList.includes(resource)) { // Second condition is for checking if the profile event meets OI4-Standards
                        checkList.push(resource);
                    } else { // If we find resource which are not part of the oi4 standard, we don't check them but we mark them as an error
                        conformityObject.resources[resource] = {
                            dataSetMessages: [],
                            validity: EValidity.nok,
                            validityErrors: ['Resource is unknown to OI4'],
                        };
                    }
                }
            }
        } catch (e) {
            LOGGER.log(e, ESyslogEventFilter.warning);
        }


        // Third, if a resourceList is specified, add those to our resources to be checked
        if (resourceList) {
            LOGGER.log(`Got ResourceList from Param: ${resourceList}`, ESyslogEventFilter.debug);
            for (const resources of resourceList) {
                if (!(checkList.includes(resources))) {
                    checkList.push(resources);
                    conformityObject.nonProfileResourceList.push(resources);
                }
            }
        }

        // move evaluation of some resources to the end to ensure that data for evaluation of these resources was previously read
        ConformityValidator.moveToEnd(checkList, Resources.LICENSE_TEXT);
        ConformityValidator.moveToEnd(checkList, Resources.METADATA);

        conformityObject.checkedResourceList = checkList;

        resObj = { // ResObj Initialization before checking all Resources
            validity: EValidity.default,
            validityErrors: ['You should not see this in prod, initialization dummy obj'],
            dataSetMessages: [],
        };

        // Actually start checking the resources
        for (const resource of checkList) {
            LOGGER.log(`Checking Resource ${resource} (High-Level)`, ESyslogEventFilter.informational);
            try {
                switch (resource) {
                    case Resources.METADATA:
                        for (const data of dataList) {
                            resObj = await this.checkMetaDataConformity(topicPreamble, data.Source, data.Filter);
                            if (resObj.validity != EValidity.ok) {
                                // meta data not valid --> don't continue
                                break;
                            }
                        }
                        break;

                    case Resources.DATA:
                        resObj = await this.checkResourceConformity(topicPreamble, resource, source);
                        dataList = ConformityValidator.collectItemReferences(resObj.dataSetMessages, Resources.DATA);
                        break;


                    case Resources.INTERFACES:
                        // TODO Update if specification is released
                        // INTERFACES are not fully described in specification yet
                        // we don't know if INTERFACES support get-requests
                        resObj = {
                            validity: EValidity.default,
                            validityErrors: ['Resource result ignored, ok'],
                            dataSetMessages: []
                        }
                        break;

                    case Resources.EVENT:
                        // We cannot trigger events by a get-request
                        // Therefore we cannot enforce that the tested asset publishes an event for the conformance validateion
                        resObj = {
                            validity: EValidity.default,
                            validityErrors: ['Resource result ignored, ok'],
                            dataSetMessages: []
                        }
                        break;

                    case Resources.PROFILE:
                        // profile was already checked
                        continue;

                    case Resources.LICENSE_TEXT:
                        if (licenseList.length == 0) {
                            // just check if there is any license text
                            resObj = await this.checkResourceConformity(topicPreamble, resource, source);
                        } else {
                            for (const license of licenseList) {
                                if (license.Filter === 'Pagination') {
                                    continue;
                                }
                                resObj = await this.checkResourceConformity(topicPreamble, resource, license.Source, license.Filter);
                                if (resObj.validity != EValidity.ok) {
                                    // text not valid --> don't continue
                                    break;
                                }
                            }
                        }

                        break;

                    case Resources.LICENSE:
                        resObj = await this.checkResourceConformity(topicPreamble, resource, source);
                        licenseList = ConformityValidator.collectItemReferences(resObj.dataSetMessages, Resources.LICENSE);
                        break;

                    default:
                        resObj = await this.checkResourceConformity(topicPreamble, resource, source);
                }
            } catch (err) {
                LOGGER.log(`${resource} did not pass check with ${err}`, ESyslogEventFilter.error);
                resObj = {
                    validity: EValidity.nok,
                    validityErrors: [err],
                    dataSetMessages: [],
                };

                errorSoFar = true;
            }

            if (resObj.validity === EValidity.ok || resObj.validity === EValidity.default) { // Set the validity according to the results
                conformityObject.resources[resource] = resObj;
            } else {
                errorSoFar = true;
            }

            // Finally, assign the temporary ResObj to the conformityObject
            conformityObject.resources[resource] = {
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

    async checkOI4IDConformity(topicPreamble: string, source?: string): Promise<EValidity> {
        let oi4Result;
        try {
            if (source == undefined) {
                const topicArray = topicPreamble.split('/');
                const originator = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
                oi4Result = await ConformityValidator.checkOi4IdConformity(originator);
            } else {
                oi4Result = await ConformityValidator.checkOi4IdConformity(source);
            }
        } catch (err) {
            LOGGER.log(`OI4-ID of the tested asset does not match the specified format: ${err}`, ESyslogEventFilter.error);
            return EValidity.default;
        }

        if (!oi4Result) {
            LOGGER.log('OI4-ID of the tested asset does not match the specified format', ESyslogEventFilter.error);
            return EValidity.default;
        }

        return EValidity.ok; // If we got past the oi4Id check, we can continue with all resources.
    }

    /**
     * Since the simple resource check does not check for additional logic, we implement those checks here
     * 1) The profile payload needs to contain the mandatory resources for its asset type
     * 2) The profile payload should not contain additional resources to the ones specified in the oi4 guideline
     * 3) Every resource that is specified in the profile payload needs to be accessible (exceptions for data, metadata, event)
     * Sidenote: "Custom" Resources will be marked as an error and not checked
     * @param topicPreamble The fullTopic that is used to check the get-route
     * @param assetType  The type of asset being tested (device / application.
     * @param source
     * @param assetType The (optional) Source.
     * @returns {IValidityDetails} A validity object containing information about the conformity of the profile resource
     */

    async checkProfileConformity(topicPreamble: string, assetType: EAssetType, source?: string): Promise<IValidityDetails> {
        let resObj: IValidityDetails;

        try {
            resObj = await this.checkResourceConformity(topicPreamble, Resources.PROFILE, source);
        } catch (e) {
            LOGGER.log(`Error in checkProfileConformity: ${e}`);
            throw e;
        }

        const profileDataSetMessage = resObj.dataSetMessages;
        const mandatoryResourceList = ConformityValidator.getMandatoryResources(assetType);
        const profilePayload = profileDataSetMessage[0].Payload;
        if (!(mandatoryResourceList.every(i => profilePayload.Resources.includes(i)))) {
            resObj.validity = EValidity.partial;
            resObj.validityErrors.push('Not every mandatory in resource list of profile.');
        }

        if (profilePayload.Resources.includes(Resources.DATA) && !profilePayload.Resources.includes(Resources.METADATA)) {
            resObj.validity = EValidity.partial;
            resObj.validityErrors.push(`Profile contains the resource "${Resources.DATA}" but not "${Resources.METADATA}".`);
        }

        return resObj;
    }

    /**
     * Retrieves a list of resources which are considered mandatory according to assetType and
     * @param assetType The type that is used to retrieve the list of mandatory resources
     * @returns {string[]} A list of mandatory resources
     */
    static getMandatoryResources(assetType: EAssetType): Resources[] {
        let mandatoryResources: Resources[];
        if (assetType === EAssetType.application) {
            mandatoryResources = Application.mandatory;
        } else {
            mandatoryResources = Device.mandatory;
        }
        return mandatoryResources;
    }

    async checkMetaDataConformity(topicPreamble: string, source: string, filter: string): Promise<IValidityDetails> {
        const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(Resources.METADATA, source);
        const conformityPayload = this.builder.buildOPCUAMetaDataMessage('Validator', 'Conformity validator', {}, DataSetClassIds[Resources.METADATA], dataSetWriterId, filter, source) as any;
        conformityPayload.MetaData = {};
        const getRequest = new GetRequest(topicPreamble, Resources.METADATA, JSON.stringify(conformityPayload), source, filter);

        const getTopic = getRequest.getTopic('get');
        const pubTopic = getRequest.getTopic('pub');

        LOGGER.log(`Trying to validate MetaData on ${getTopic} (Low-Level).`, ESyslogEventFilter.warning);
        const response = await this.messageBusLookup.getMessage(getRequest);
        LOGGER.log(`Received MetaData conformity from ${pubTopic}.`, ESyslogEventFilter.warning);

        const errorMsgArr = [];
        const parsedMessage = JSON.parse(response.RawMessage.toString()) as IOPCUADataSetMetaData;
        let eRes: number;
        const schemaResult: ISchemaConformity = await this.checkSchemaConformity(Resources.METADATA, parsedMessage);
        if (schemaResult.schemaResult) { // Check if the schema validator threw any faults, schemaResult is an indicator for overall faults
            if (parsedMessage.CorrelationId === conformityPayload.MessageId) { // Check if the correlationId matches our messageId (according to guideline)
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

        return {
            validity: eRes,
            validityErrors: errorMsgArr,
            dataSetMessages: [],
        };
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
     * @param source - the Source of the requestor, in most cases their oi4Id
     * @param filter - the filter (if available)
     */
    async checkResourceConformity(topicPreamble: string, resource: Resources, source?: string, filter?: string): Promise<IValidityDetails> {

        const conformityPayload = this.builder.buildOPCUANetworkMessage([], new Date, DataSetClassIds[resource]);
        const getRequest = new GetRequest(topicPreamble, resource, JSON.stringify(conformityPayload), source, filter);

        const getTopic = getRequest.getTopic(Methods.GET);
        const pubTopic = getRequest.getTopic(Methods.PUB);

        LOGGER.log(`Trying to validate resource ${resource} on ${getTopic} (Low-Level).`, ESyslogEventFilter.informational);
        const response = await this.messageBusLookup.getMessage(getRequest);
        LOGGER.log(`Received conformity message on ${resource} from ${pubTopic}.`, ESyslogEventFilter.informational);

        const errorMsgArr = [];
        const parsedMessage = JSON.parse(response.RawMessage.toString()) as IOPCUANetworkMessage;
        let eRes: number;
        const schemaResult: ISchemaConformity = await this.checkSchemaConformity(resource, parsedMessage);
        if (schemaResult.schemaResult) { // Check if the schema validator threw any faults, schemaResult is an indicator for overall faults
            if (parsedMessage.CorrelationId === conformityPayload.MessageId) { // Check if the correlationId matches our messageId (according to guideline)
                eRes = EValidity.ok;
            } else {
                eRes = EValidity.partial;
                errorMsgArr.push(`CorrelationId did not pass for ${pubTopic}.`);
                LOGGER.log(`CorrelationId did not pass for ${pubTopic}.`, ESyslogEventFilter.error);
            }
        } else { // Oops, we have schema errors, let's show them to the user so they can fix them...
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

        return {
            validity: eRes,
            validityErrors: errorMsgArr,
            dataSetMessages: parsedMessage.Messages,
        };
    }

    /**
     * Checks the conformity of the payload by testing it against the correct schemas using the ajv library
     * Both the networkmessage and the actual payload are tested and only return a positive result if both passed
     * @param resource The resource that is being checked
     * @param payload  The payload that is being checked
     * @returns true, if both the networkmessage and the payload fit the resource, false otherwise
     */
    async checkSchemaConformity(resource: Resources, payload: any): Promise<ISchemaConformity> {
        let messageValidationResult;
        let payloadValidationResult = false;

        const networkMessageResultMsgArr: string[] = [];
        const payloadResultMsgArr: string[] = [];

        try {
            const schema = resource == Resources.METADATA ? 'DataSetMetaData.schema.json' : 'NetworkMessage.schema.json';
            messageValidationResult = await this.jsonValidator.validate(schema, payload);
        } catch (networkMessageValidationErr) {
            LOGGER.log(`AJV (Catch NetworkMessage): (${resource}):${networkMessageValidationErr}`, ESyslogEventFilter.error);
            networkMessageResultMsgArr.push(JSON.stringify(networkMessageValidationErr));
            messageValidationResult = false;
        }

        if (!messageValidationResult) {
            const errText = JSON.stringify(this.jsonValidator.errors);
            LOGGER.log(`AJV: NetworkMessage invalid (${resource}): ${JSON.stringify(errText)}`, ESyslogEventFilter.error);
            networkMessageResultMsgArr.push(errText);
        }

        if (messageValidationResult) {
            if (payload.MessageType === 'ua-metadata') {
                payloadValidationResult = true; // Metadata was already validated by DataSetMetaData.schema.json
            } else if (resource == Resources.DATA) {
                payloadValidationResult = true; // Data can be anything and therefore no schema exists

            } else { // Since it's a data message, we can check against schemas
                try {
                    for (const payloads of payload.Messages) {
                        const schemaName = ConformityValidator.getPubPayloadSchema(resource);
                        payloadValidationResult = await this.jsonValidator.validate(schemaName, payloads.Payload);
                        if (!payloadValidationResult) {
                            const paginationResult = await this.jsonValidator.validate('Pagination.schema.json', payloads.Payload);
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
                schemaResult: messageValidationResult,
                resultMsgArr: networkMessageResultMsgArr,
            },
            payload: {
                schemaResult: payloadValidationResult,
                resultMsgArr: payloadResultMsgArr,
            },
        };

        if (messageValidationResult && payloadValidationResult) {
            schemaConformity.schemaResult = true;
        } else {
            LOGGER.log('Faulty payload, see Conformity Result object for further information', ESyslogEventFilter.warning);
            LOGGER.log(JSON.stringify(schemaConformity), ESyslogEventFilter.debug);
        }

        return schemaConformity;
    }

    private static getPubPayloadSchema(resource: Resources): string {
        switch (resource) {
            case Resources.CONFIG:
                return 'ConfigPublish.schema.json';

            default:
                return `${resource}.schema.json`;
        }
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
            return await ConformityValidator.checkOi4IdConformity(oi4Id);
        } else { /*tslint:disable-line*/
            return false; // For minimum validity, we need oi4ID (length: 6) + method + method
        }
    }

    static async checkOi4IdConformity(oi4Id: string): Promise<boolean> {
        const oi4Array = oi4Id.split('/');
        if (oi4Array.length !== 4) return false; // throw new Error('Wrong number of subTopics');
        // further checks will follow!
        const oi4RegEx = new RegExp(/^(([a-z0-9-]+\.)*([a-z0-9-]*)(?:\/[^\/`\\^\r\n]+){3})$/g);
        if (oi4RegEx.test(oi4Id)) return true;
        LOGGER.log('Error in checkOI4IDConformity!', ESyslogEventFilter.informational);
        return false;
    }

    private static moveToEnd<Type>(array: Type[], item: Type): void {
        if (array.includes(item)) {
            // move 'Resource.LicenseText' to the end of the checklist so that we can ensure that the licenseList is filled
            array.push(array.splice(array.indexOf(item), 1)[0]);
        }
    }

    private static collectItemReferences(messages: IOPCUADataSetMessage[], resource: Resources): ItemRef[] {
        const result: ItemRef[] = [];

        for (const dataSetMessage of messages) {
            if (typeof dataSetMessage.Payload.page !== 'undefined') {
                LOGGER.log(`Found pagination in ${resource}!`);
            } else if (ConformityValidator.isNotEmpty(dataSetMessage.Filter) && ConformityValidator.isNotEmpty(dataSetMessage.Source)) {
                result.push({Source: dataSetMessage.Source, Filter: dataSetMessage.Filter});
            }
        }

        return result;
    }

    private static isNotEmpty(input: string): boolean {
        return input != undefined && true && input.length > 0;
    }
}
