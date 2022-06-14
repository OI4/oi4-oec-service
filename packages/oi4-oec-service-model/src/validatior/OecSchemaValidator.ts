// Constants
import {resourcesSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {topicPathSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {DeviceHealthEnumerationSchemaJson} from '@oi4/oi4-oec-json-schemas';

// Payloads
import {healthSchemaJson} from '@oi4/oi4-oec-json-schemas'
import {mamSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {licenseSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {licenseTextSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {profileSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {eventSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {rtLicenseSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {configPublishSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {configSetSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {publicationListSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {subscriptionListSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {referenceDesignationSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {localeSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {paginationSchemaJson} from '@oi4/oi4-oec-json-schemas';
import {buildOpcUaJsonValidator} from '@oi4/oi4-oec-service-opcua-model';

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
