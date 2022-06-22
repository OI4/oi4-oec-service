export enum AsyncClientEvents {
    ERROR = 'error',
    CLOSE = 'close',
    DISCONNECT = 'disconnect',
    RECONNECT = 'reconnect',
    CONNECT = 'connect',
    RESOURCE_CHANGED = 'resourceChanged',
    MESSAGE = 'message',
}

//FIXME is the name of this enum ok? Or is better something more related to CDataSetWriterIdLookup
export enum ResourceType {
    MAM = 'mam',
    HEALTH = 'health',
    LICENCE = 'license',
    LICENSE_TEXT = 'licenseText',
    RT_LICENSE = 'rtLicense',
    PROFILE = 'profile',
    CONFIG = 'config',
    PUBLICATION_LIST = 'publicationList',
    SUBSCRIPTION_LIST = 'subscriptionList',
    //FIXME Are the following correct?
    OPC_UA_STATUS = 'status',
    SYSLOG = 'syslog',
    NAMUR_NE107 = 'ne107',
    GENERIC = 'generic',
}

export enum TopicMethods {
    GET = 'get',
    PUB = 'pub',
    SET = 'set',
    DEL = 'del',
}

export enum PublishEventCategories {
    CAT_SYSLOG_0 = 'CAT_SYSLOG_0',
    CAT_STATUS_1 = 'CAT_STATUS_1',
    CAT_NE107_2 = 'CAT_NE107_2',
    CAT_GENERIC_99 = 'CAT_GENERIC_99',
}

export enum PublishEventSubResource {
    OPC_UA_STATUS = 'status',
    SYSLOG = 'syslog',
    NAMUR_NE107 = 'ne107',
    GENERIC = 'generic',
}

export enum PayloadTypes {
    EMPTY = 'empty',
    LOCALE = 'locale',
    PAGINATION= 'pagination',
    NONE = 'none',
}
