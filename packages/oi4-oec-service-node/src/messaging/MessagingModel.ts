export enum AsyncClientEvents {
    ERROR = 'error',
    CLOSE = 'close',
    DISCONNECT = 'disconnect',
    RECONNECT = 'reconnect',
    CONNECT = 'connect',
    MESSAGE = 'message',
    OFFLINE = 'offline',
}

export enum PayloadTypes {
    EMPTY = 'empty',
    LOCALE = 'locale',
    PAGINATION= 'pagination',
    NONE = 'none',
}
