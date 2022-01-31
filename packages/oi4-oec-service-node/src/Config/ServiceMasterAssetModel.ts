import {EOPCUALocale, IMasterAssetModel} from "@oi4/oi4-oec-service-opcua-model";

export const ServiceMasterAssetModel: IMasterAssetModel = {
    Manufacturer: {
        locale: EOPCUALocale.enUS,
        text: "Hilscher"
    },
    ManufacturerUri: "hilscher.com",
    Model: {
        locale: EOPCUALocale.enUS,
        text: "OEC Registry"
    },
    ProductCode: "OEC-REG",
    HardwareRevision: "",
    SoftwareRevision: "0.12.1",
    DeviceRevision: "",
    DeviceManual: "",
    DeviceClass: "Registry",
    SerialNumber: "OEC-Registry",
    ProductInstanceUri: "",
    RevisionCounter: 0,
    Description: {
        locale: EOPCUALocale.enUS,
        text: "The OEC Registry, an Open Industry 4.0 Alliance application"
    }
}
