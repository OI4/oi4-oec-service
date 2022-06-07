// Base
import oi4IdentifierSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/oi4Identifier.schema.json';

// Constants
import resourcesSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/constants/resources.schema.json';
import topicPathSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/constants/topicPath.schema.json';
import serviceTypeSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/constants/serviceType.schema.json';
import DeviceHealthEnumerationSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/constants/DeviceHealthEnumeration.schema.json';

// Payloads
import healthSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/health.schema.json';
import mamSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/mam.schema.json';
import licenseSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/license.schema.json';
import licenseTextSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/licenseText.schema.json';
import profileSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/profile.schema.json';
import eventSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/event.schema.json';
import rtLicenseSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/rtLicense.schema.json';
import configPublishSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/configPublish.schema.json';
import configSetSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/configSet.schema.json';
import publicationListSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/publicationList.schema.json';
import subscriptionListSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/subscriptionList.schema.json';
import referenceDesignationSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/referenceDesignation.schema.json';
import localeSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/locale.schema.json';
import paginationSchemaJson from '@oi4/oi4-oec-json-schemas/schemas/pagination.schema.json';
import { buildOpcUaJsonValidator } from "@oi4/oi4-oec-service-opcua-model";

export {
    // Base
    oi4IdentifierSchemaJson,
    // Constants
    resourcesSchemaJson,
    topicPathSchemaJson,
    serviceTypeSchemaJson,
    DeviceHealthEnumerationSchemaJson,
    // Payloads
    healthSchemaJson,
    mamSchemaJson,
    licenseSchemaJson,
    licenseTextSchemaJson,
    profileSchemaJson,
    eventSchemaJson,
    rtLicenseSchemaJson,
    configPublishSchemaJson,
    configSetSchemaJson,
    publicationListSchemaJson,
    subscriptionListSchemaJson,
    referenceDesignationSchemaJson,
    localeSchemaJson,
    paginationSchemaJson
}

/**
 * Builder method to create an Ajv based JSon Schema validator for OPC UA JSon messages
 */
export const buildOecJsonValidator = () => {
    const jsonValidator = buildOpcUaJsonValidator();

    // Then constants
    jsonValidator.addSchema(resourcesSchemaJson, 'resources.schema.json');
    jsonValidator.addSchema(DeviceHealthEnumerationSchemaJson, 'DeviceHealthEnumeration.json');
    jsonValidator.addSchema(topicPathSchemaJson, 'topicPath.schema.json');

    // OI4 OEC payload schemas
    jsonValidator.addSchema(healthSchemaJson, 'health.schema.json');
    jsonValidator.addSchema(mamSchemaJson, 'mam.schema.json');
    jsonValidator.addSchema(licenseSchemaJson, 'license.schema.json');
    jsonValidator.addSchema(licenseTextSchemaJson, 'licenseText.schema.json');
    jsonValidator.addSchema(profileSchemaJson, 'profile.schema.json');
    jsonValidator.addSchema(eventSchemaJson, 'event.schema.json');
    jsonValidator.addSchema(rtLicenseSchemaJson, 'rtLicense.schema.json');
    jsonValidator.addSchema(configPublishSchemaJson, 'configPublish.schema.json');
    jsonValidator.addSchema(configSetSchemaJson, 'configSet.schema.json');
    jsonValidator.addSchema(publicationListSchemaJson, 'publicationList.schema.json');
    jsonValidator.addSchema(subscriptionListSchemaJson, 'subscriptionList.schema.json');
    jsonValidator.addSchema(referenceDesignationSchemaJson, 'referenceDesignation.schema.json');
    jsonValidator.addSchema(localeSchemaJson, 'locale.schema.json');
    jsonValidator.addSchema(paginationSchemaJson, 'pagination.schema.json');

    return jsonValidator;
}
