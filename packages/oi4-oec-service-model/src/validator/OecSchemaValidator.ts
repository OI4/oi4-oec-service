// Constants
import {
    resourcesSchemaJson,
    topicPathSchemaJson,
    DeviceHealthEnumerationSchemaJson,
    interfacesSchemaJson,
    DataSetMetaDataSchemaJson,
    DataSetMetaDataTypeSchemaJson,
    dataPVSchemaJson,
    FieldMetaDataSchemaJson,
    EnumDescriptionSchemaJson,
    StructureDescriptionSchemaJson,
    SimpleTypeDescriptionSchemaJson,
    KeyValuePairSchemaJson,
    NodeIdSchemaJson,
    QualifiedNameSchemaJson,
    BaseDataTypeSchemaJson
} from '@oi4/oi4-oec-json-schemas';

// Payloads
import {
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
    paginationSchemaJson,
} from '@oi4/oi4-oec-json-schemas';
import {buildOpcUaJsonValidator} from '../opcua/OpcUaSchemaProvider';
import Ajv from 'ajv';


/**
 * Builder method to create an Ajv based JSon Schema validator for OPC UA JSon messages
 */
export const buildOecJsonValidator = (): Ajv => {
    const jsonValidator = buildOpcUaJsonValidator();

    // Then constants
    jsonValidator.addSchema(resourcesSchemaJson, 'resources.schema.json');
    jsonValidator.addSchema(DeviceHealthEnumerationSchemaJson, 'DeviceHealthEnumeration.json');
    jsonValidator.addSchema(topicPathSchemaJson, 'topicPath.schema.json');

    // OI4 OEC payload schemas
    jsonValidator.addSchema(healthSchemaJson, 'Health.schema.json');
    jsonValidator.addSchema(mamSchemaJson, 'MAM.schema.json');
    jsonValidator.addSchema(licenseSchemaJson, 'License.schema.json');
    jsonValidator.addSchema(licenseTextSchemaJson, 'LicenseText.schema.json');
    jsonValidator.addSchema(profileSchemaJson, 'Profile.schema.json');
    jsonValidator.addSchema(eventSchemaJson, 'Event.schema.json');
    jsonValidator.addSchema(rtLicenseSchemaJson, 'RtLicense.schema.json');
    jsonValidator.addSchema(configPublishSchemaJson, 'ConfigPublish.schema.json');
    jsonValidator.addSchema(configSetSchemaJson, 'ConfigSet.schema.json');
    jsonValidator.addSchema(publicationListSchemaJson, 'PublicationList.schema.json');
    jsonValidator.addSchema(subscriptionListSchemaJson, 'SubscriptionList.schema.json');
    jsonValidator.addSchema(referenceDesignationSchemaJson, 'ReferenceDesignation.schema.json');
    jsonValidator.addSchema(localeSchemaJson, 'Locale.schema.json');
    jsonValidator.addSchema(paginationSchemaJson, 'Pagination.schema.json');
    jsonValidator.addSchema(interfacesSchemaJson, 'Interfaces.schema.json');

    jsonValidator.addSchema(dataPVSchemaJson, 'DataPV.schema.json');
    jsonValidator.addSchema(DataSetMetaDataSchemaJson, 'DataSetMetaData.schema.json');
    jsonValidator.addSchema(DataSetMetaDataTypeSchemaJson, 'DataSetMetaDataType.schema.json');
    jsonValidator.addSchema(FieldMetaDataSchemaJson, 'FieldMetaData.schema.json');
    jsonValidator.addSchema(EnumDescriptionSchemaJson, 'EnumDescription.schema.json');
    jsonValidator.addSchema(StructureDescriptionSchemaJson, 'StructureDescription.schema.json');
    jsonValidator.addSchema(SimpleTypeDescriptionSchemaJson, 'SimpleTypeDescription.schema.json');
    jsonValidator.addSchema(KeyValuePairSchemaJson, 'KeyValuePair.schema.json');
    jsonValidator.addSchema(NodeIdSchemaJson, 'NodeId.schema.json');
    jsonValidator.addSchema(QualifiedNameSchemaJson, 'QualifiedName.schema.json');
    jsonValidator.addSchema(BaseDataTypeSchemaJson, 'BaseDataType.schema.json');

    return jsonValidator;
}
