/**
 * Available OI4 resource types.
 * Note: LICENSE and LICENSE_TEXT are deprecated per ADR 002.
 */
export enum Resources {
    MAM = 'MAM',
    HEALTH = 'Health',
    PROFILE = 'Profile',
    DATA = 'Data',
    CONFIG = 'Config',
    EVENT = 'Event',
    METADATA = 'Metadata',
    PUBLICATION_LIST = 'PublicationList',
    SUBSCRIPTION_LIST = 'SubscriptionList',
    REFERENCE_DESIGNATION = 'ReferenceDesignation',
    AAS = 'AAS'
}

export function getResource(resource: string): Resources {
    switch (resource) {
        case Resources.MAM:
            return Resources.MAM;
        case Resources.HEALTH:
            return Resources.HEALTH;
        case Resources.PROFILE:
            return Resources.PROFILE;
        case Resources.DATA:
            return Resources.DATA;
        case Resources.CONFIG:
            return Resources.CONFIG;
        case Resources.EVENT:
            return Resources.EVENT;
        case Resources.METADATA:
            return Resources.METADATA;
        case Resources.PUBLICATION_LIST:
            return Resources.PUBLICATION_LIST;
        case Resources.SUBSCRIPTION_LIST:
            return Resources.SUBSCRIPTION_LIST;
        case Resources.REFERENCE_DESIGNATION:
            return Resources.REFERENCE_DESIGNATION;
        case Resources.AAS:
            return Resources.AAS;
        default:
            throw new Error(`Unknown resource: ${resource}`);
    }
}



