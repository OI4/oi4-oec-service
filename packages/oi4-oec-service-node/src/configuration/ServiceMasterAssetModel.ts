import {EOPCUALocale, IMasterAssetModel} from '@oi4/oi4-oec-service-opcua-model';

export const ServiceMasterAssetModel: IMasterAssetModel = {
    Manufacturer: {
        Locale: EOPCUALocale.enUS,
        Text: 'Hilscher'
    },
    ManufacturerUri: 'hilscher.com',
    Model: {
        Locale: EOPCUALocale.enUS,
        Text: 'OEC Registry'
    },
    ProductCode: 'OEC-REG',
    HardwareRevision: '',
    SoftwareRevision: '1.1.0',
    DeviceRevision: '',
    DeviceManual: '',
    DeviceClass: 'Registry',
    SerialNumber: 'OEC-Registry',
    ProductInstanceUri: '',
    RevisionCounter: 0,
    Description: {
        Locale: EOPCUALocale.enUS,
        Text: 'The OEC Registry, an Open Industry 4.0 Alliance application'
    }
}
