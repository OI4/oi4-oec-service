// Constants
import {resourcesSchemaJson, 
    topicPathSchemaJson,
    DeviceHealthEnumerationSchemaJson} from '@oi4/oi4-oec-json-schemas';

// Payloads
import {healthSchemaJson,
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
    interfacesSchemaJson,
    dataPVSchemaJson,    
    DataSetMetaDataSchemaJson,
    DataSetMetaDataTypeSchemaJson,
    FieldMetaDataSchemaJson, 
    EnumDescriptionSchemaJson,
    StructureDescriptionSchemaJson,
    SimpleTypeDescriptionSchemaJson,
    KeyValuePairSchemaJson,
    NodeIdSchemaJson,
    QualifiedNameSchemaJson,
    BaseDataTypeSchemaJson
} from '@oi4/oi4-oec-json-schemas';

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
    jsonValidator.addSchema(interfacesSchemaJson, 'interfaces.schema.json');

    jsonValidator.addSchema(dataPVSchemaJson, 'dataPV.schema.json');
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
