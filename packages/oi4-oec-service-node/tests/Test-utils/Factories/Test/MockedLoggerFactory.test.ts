// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {LoggerItems, MockedLoggerFactory} from '../MockedLoggerFactory';

describe('Unit test for MockedLoggerFactory ', () => {

    it('The factory works', async () => {
        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
        const fakeLogFile: Array<string> = loggerItems.fakeLogFile;

        loggerItems.fakeLogger.log('This is a message');
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe('This is a message');
    });

});