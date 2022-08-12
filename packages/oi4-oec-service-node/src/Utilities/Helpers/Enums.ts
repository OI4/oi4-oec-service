export enum AsyncClientEvents {
    ERROR = 'error',
    CLOSE = 'close',
    DISCONNECT = 'disconnect',
    RECONNECT = 'reconnect',
    CONNECT = 'connect',
    MESSAGE = 'message',
    OFFLINE = 'offline',
}

export enum TopicMethods {
    GET = 'Get',
    PUB = 'Pub',
    SET = 'Set',
    DEL = 'Del',
    CALL  = 'Call',
    REPLY = 'Reply'
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
        case TopicMethods.CALL:
            return TopicMethods.CALL;
        case TopicMethods.REPLY:
            return TopicMethods.REPLY;
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
