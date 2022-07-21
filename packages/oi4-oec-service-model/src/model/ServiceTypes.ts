export enum ServiceTypes {
    REGISTRY = 'Registry',
    OT_CONNECTOR = 'OTConnector',
    UTILITY = 'Utility',
    PERSISTENCE = 'Persistence',
    AGGREGATION = 'Aggregation',
    OOC_CONNECTOR = 'OOCConnector',
    IT_CONNECTOR = 'ITConnector'
}

export function getServiceType(type: string): ServiceTypes{
    switch (type) {
        case ServiceTypes.REGISTRY:
            return ServiceTypes.REGISTRY;
        case ServiceTypes.OT_CONNECTOR:
            return ServiceTypes.OT_CONNECTOR;
        case ServiceTypes.UTILITY:
            return ServiceTypes.UTILITY;
        case ServiceTypes.PERSISTENCE:
            return ServiceTypes.PERSISTENCE;
        case ServiceTypes.AGGREGATION:
            return ServiceTypes.AGGREGATION;
        case ServiceTypes.OOC_CONNECTOR:
            return ServiceTypes.OOC_CONNECTOR;
        case ServiceTypes.IT_CONNECTOR:
            return ServiceTypes.IT_CONNECTOR;
        default:
            throw new Error(`Unknown service type: ${type}`);
    }
}