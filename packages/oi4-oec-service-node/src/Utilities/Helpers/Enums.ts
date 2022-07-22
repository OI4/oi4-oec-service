export enum AsyncClientEvents {
    ERROR = 'error',
    CLOSE = 'close',
    DISCONNECT = 'disconnect',
    RECONNECT = 'reconnect',
    CONNECT = 'connect',
    RESOURCE_CHANGED = 'resourceChanged',
    MESSAGE = 'message',
    OFFLINE = 'offline',
}

export enum TopicMethods {
    GET = 'get',
    PUB = 'pub',
    SET = 'set',
    DEL = 'del',
}

export function getTopicMethod(method: string) : TopicMethods {
    switch (method) {
        case TopicMethods.GET:
            return TopicMethods.GET;
        case TopicMethods.PUB:
            return TopicMethods.PUB;
        case TopicMethods.SET:
            return TopicMethods.SET;
        case TopicMethods.DEL:
            return TopicMethods.DEL;
        default:
            throw new Error(`Unknown method: ${method}`);
    }
}

export enum PayloadTypes {
    EMPTY = 'empty',
    LOCALE = 'locale',
    PAGINATION= 'pagination',
    NONE = 'none',
}
