import {EventEmitter} from 'events';

export class TypedEventEmitter<T extends Record<keyof any, any[]>> extends EventEmitter {
    emit<K extends keyof T>(eventName: K, ...args: T[K]): boolean {
        return super.emit(eventName as string | symbol, ...args);
    }

    on<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.on(eventName as string | symbol, listener);
    }

    once<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.once(eventName as string | symbol, listener);
    }

    removeListener<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.removeListener(eventName as string | symbol, listener);
    }

    off<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.off(eventName as string | symbol, listener);
    }

    removeAllListeners<K extends keyof T>(event?: K): this {
        return super.removeAllListeners(event as string | symbol);
    }

    listeners<K extends keyof T>(eventName: K): Function[] {
        return super.listeners(eventName as string | symbol);
    }

    rawListeners<K extends keyof T>(eventName: K): Function[] {
        return super.rawListeners(eventName as string | symbol);
    }

    listenerCount<K extends keyof T>(eventName: K): number {
        return super.listenerCount(eventName as string | symbol);
    }

    prependListener<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.prependListener(eventName as string | symbol, listener);
    }

    prependOnceListener<K extends keyof T>(eventName: K, listener: (...args: T[K]) => void): this {
        return super.prependOnceListener(eventName as string | symbol, listener);
    }
}
