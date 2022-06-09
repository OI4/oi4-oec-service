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
}

export enum TopicMethods {
    GET = 'get',
    PUB = 'pub',
    SET = 'set',
    DEL = 'del',
}

export enum PayloadTypes {
    EMPTY = 'empty',
    LOCALE = 'locale',
    PAGINATION= 'pagination',
    NONE = 'none',
}