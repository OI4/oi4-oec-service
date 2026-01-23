/**
 * Available OI4 resource types.
 * Note: LICENSE and LICENSE_TEXT are deprecated per ADR 002.
 */
export enum Resources {
    MAM = 'MAM',
    HEALTH = 'Health',
    /** @deprecated ADR 002: Use SBOM files at /opt/oi4/licenses instead */
    LICENSE = 'License',
    /** @deprecated ADR 002: Use SBOM files at /opt/oi4/licenses instead */
    LICENSE_TEXT = 'LicenseText',
    PROFILE = 'Profile',
    DATA = 'Data',
    RT_LICENSE = 'RtLicense',
    CONFIG = 'Config',
    EVENT = 'Event',
    METADATA = 'Metadata',
    PUBLICATION_LIST = 'PublicationList',
    SUBSCRIPTION_LIST = 'SubscriptionList',
    REFERENCE_DESIGNATION = 'ReferenceDesignation',
    INTERFACES = 'Interfaces',
    AAS = 'AAS'
}

export function getResource(resource: string): Resources {
    switch (resource) {
        case Resources.MAM:
            return Resources.MAM;
        case Resources.HEALTH:
            return Resources.HEALTH;
        case Resources.LICENSE:
            return Resources.LICENSE;
        case Resources.LICENSE_TEXT:
            return Resources.LICENSE_TEXT;
        case Resources.PROFILE:
            return Resources.PROFILE;
        case Resources.DATA:
            return Resources.DATA;
        case Resources.RT_LICENSE:
            return Resources.RT_LICENSE;
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
        case Resources.INTERFACES:
            return Resources.INTERFACES;
        case Resources.AAS:
            return Resources.AAS;
        default:
            throw new Error(`Unknown resource: ${resource}`);
    }
}



