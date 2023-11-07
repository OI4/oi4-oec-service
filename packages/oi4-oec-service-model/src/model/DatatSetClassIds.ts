import {Resources} from "./Resources";

export interface IDataSetClassIds extends Record<string, string> {
    MAM: string;
    Health: string;
    License: string;
    LicenseText: string;
    RtLicense: string;
    Event: string;
    Profile: string;
    Config: string;
    PublicationList: string;
    SubscriptionList: string;
    Interfaces: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataSetClassIds: IDataSetClassIds = {
    MAM: '360ca8f3-5e66-42a2-8f10-9cdf45f4bf58',
    Health: 'd8e7b6df-42ba-448a-975a-199f59e8ffeb',
    License: '2ae0505e-2830-4980-b65e-0bbdf08e2d45',
    LicenseText: 'a6e6c727-4057-419f-b2ea-3fe9173e71cf',
    RtLicense: 'ebd12d4b-da1c-4671-ab86-db102fecc603',
    Event: '543ae05e-b6d9-4161-a0a3-350a0fac5976',
    Profile: '48017c6a-05c8-48d7-9d85-4b08bbb707f3',
    Config: '9d5983db-440d-4474-9fd7-1cd7a6c8b6c2',
    PublicationList: '217434d6-6e1e-4230-b907-f52bc9ffe152',
    SubscriptionList: 'e5d68c47-c276-4929-8ab9-4c1090cac785',
    ReferenceDesignation: '27a75019-164a-496d-a38b-90e8a55c2cfa',
    Interfaces: '96d22d73-bce6-42d3-9949-45e0d04e4d54'
}

export function getDataSetClassId(resource: Resources): string {
    switch (resource) {
        case Resources.MAM:
            return DataSetClassIds.MAM;
        case Resources.HEALTH:
            return DataSetClassIds.HEALTH;
        case Resources.LICENSE:
            return DataSetClassIds.LICENSE;
        case Resources.LICENSE_TEXT:
            return DataSetClassIds.LICENSE_TEXT;
        case Resources.PROFILE:
            return DataSetClassIds.PROFILE;
        case Resources.DATA:
            return DataSetClassIds.DATA;
        case Resources.RT_LICENSE:
            return DataSetClassIds.RT_LICENSE;
        case Resources.CONFIG:
            return DataSetClassIds.CONFIG;
        case Resources.EVENT:
            return DataSetClassIds.EVENT;
        case Resources.METADATA:
            return DataSetClassIds.METADATA;
        case Resources.PUBLICATION_LIST:
            return DataSetClassIds.PUBLICATION_LIST;
        case Resources.SUBSCRIPTION_LIST:
            return DataSetClassIds.SUBSCRIPTION_LIST;
        case Resources.REFERENCE_DESIGNATION:
            return DataSetClassIds.REFERENCE_DESIGNATION;
        case Resources.INTERFACES:
            return DataSetClassIds.INTERFACES;
        default:
            throw new Error(`Unknown resource: ${Resources}`);
    }
}
