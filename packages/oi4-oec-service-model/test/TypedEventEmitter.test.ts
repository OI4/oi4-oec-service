import {TypedEventEmitter} from '../src/model/TypedEventEmitter';

interface TestEvents extends Record<string, any[]>{
    'noArgs': [];
    'oneArg': [string];
    'multipleArgs': [number, boolean];
}

describe('TypedEventEmitter', () => {
    let emitter: TypedEventEmitter<TestEvents>;

    beforeEach(() => {
        emitter = new TypedEventEmitter<TestEvents>();
    });

    it('should emit and listen to events with no arguments', (done) => {
        emitter.on('noArgs', () => {
            done();
        });
        emitter.emit('noArgs');
    });

    it('should emit and listen to events with one argument', (done) => {
        const payload = 'test';
        emitter.on('oneArg', (arg) => {
            expect(arg).toBe(payload);
            done();
        });
        emitter.emit('oneArg', payload);
    });

    it('should emit and listen to events with multiple arguments', (done) => {
        const arg1 = 42;
        const arg2 = true;
        emitter.on('multipleArgs', (a1, a2) => {
            expect(a1).toBe(arg1);
            expect(a2).toBe(arg2);
            done();
        });
        emitter.emit('multipleArgs', arg1, arg2);
    });

    it('should support once', (done) => {
        let count = 0;
        emitter.once('noArgs', () => {
            count++;
        });
        emitter.emit('noArgs');
        emitter.emit('noArgs');
        setTimeout(() => {
            expect(count).toBe(1);
            done();
        }, 10);
    });

    it('should support off/removeListener', () => {
        const listener = jest.fn();
        emitter.on('noArgs', listener);
        emitter.off('noArgs', listener);
        emitter.emit('noArgs');
        expect(listener).not.toHaveBeenCalled();
    });

    it('should support removeAllListeners', () =>{
        const listener = jest.fn();
        emitter.on('noArgs', listener);
        emitter.removeAllListeners('noArgs');
        emitter.emit('noArgs');
        expect(listener).not.toHaveBeenCalled();
    });

     it('should support listeners', () => {
        const listener = () => {};
        emitter.on('noArgs', listener);
        expect(emitter.listeners('noArgs')).toContain(listener);
    });

    it('listenerCount works', () => {
        emitter.on('noArgs', () => {});
        expect(emitter.listenerCount('noArgs')).toBe(1);
    });

    it('prependListener works', () => {
        const order = [];
        emitter.on('noArgs', () => order.push(2));
        emitter.prependListener('noArgs', () => order.push(1));
        emitter.emit('noArgs');
        expect(order).toEqual([1, 2]);
    });

    it('prependOnceListener works', () => {
         const order = [];
        emitter.on('noArgs', () => order.push(2));
        emitter.prependOnceListener('noArgs', () => order.push(1));
        emitter.emit('noArgs');
        emitter.emit('noArgs');
        expect(order).toEqual([1, 2, 2]);
    });

    it('rawListeners works', () => {
        const listener = () => {};
        emitter.on('noArgs', listener);
        expect(emitter.rawListeners('noArgs')).toContain(listener);
    });
});
