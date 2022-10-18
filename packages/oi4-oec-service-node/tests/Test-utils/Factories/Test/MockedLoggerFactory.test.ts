import {LoggerItems, MockedLoggerFactory} from '../MockedLoggerFactory';

describe('Unit test for MockedLoggerFactory ', () => {

    it('The factory works', async () => {
        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();

        loggerItems.fakeLogger.log('This is a message');
        expect(loggerItems.fakeLogFile.length).toBe(1);
        expect(loggerItems.fakeLogFile[0]).toBe('This is a message');
        expect(loggerItems.isLogEmpty()).toBeFalsy();
        expect(loggerItems.logContainsOnly('This is a message')).toBeTruthy();
        expect(loggerItems.getLogSize()).toBe(1);

        loggerItems.fakeLogger.log('This is a message 2');
        expect(loggerItems.logContainsOnly('This is a message')).toBeFalsy();
        expect(loggerItems.logContains('This is a message')).toBeTruthy();
        expect(loggerItems.logContains('This is a message 2')).toBeTruthy();

        loggerItems.clearLogFile();
        expect(loggerItems.isLogEmpty()).toBeTruthy();
    });

});