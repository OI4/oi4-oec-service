enum AsyncClientEvents {
    ERROR = 'error',
    CLOSE = 'close',
    DISCONNECT = 'disconnect',
    RECONNECT = 'reconnect',
    CONNECT = 'connect',
    RESOURCE_CHANGED = 'resourceChanged',
    MESSAGE = 'message',
}

enum ResourceType {
    HEALTH = 'health',
    MAM = 'mam',
    PROFILE = 'profile',
    RT_LICENSE = 'rtLicense',
    LICENSE_TEXT = 'licenseText',
    LICENCE = 'license',
    PUBLICATION_LIST = 'publicationList',
    SUBSCRIPTION_LIST = 'subscriptionList',
    CONFIG = 'config',
}

enum TopicMethods {
    GET = 'get',
    PUB = 'pub',
    SET = 'set',
    DEL = 'del',
}

enum PayloadTypes {
    EMPTY = 'empty',
    LOCALE = 'locale',
    PAGINATION= 'pagination',
    NONE = 'none',
}