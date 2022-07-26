// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as winston from 'winston';
import {Logger, setLogger} from '@oi4/oi4-oec-service-logger';

export type LoggerItems = {
    fakeLogger: Logger;
    fakeLogFile: Array<string>;
    clearLogFile: Function;
    logContainsOnly: Function;
    logContains: Function;
    getLogSize: Function;
    isLogEmpty: Function;
}

export class MockedLoggerFactory {

    public static getLoggerItems(): LoggerItems {

        const fakeLogFile: Array<string> = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const fakeLogger: Logger = {
            log: (str: string) => {
                fakeLogFile.push(str);
                return str;
            }
        };

        // trying to mock createLogger to return a specific logger instance
        jest.mock('winston', () => ({
            format: {
                colorize: jest.fn(),
                combine: jest.fn(),
                label: jest.fn(),
                timestamp: jest.fn(),
                printf: jest.fn()
            },
            createLogger: jest.fn().mockReturnValue(fakeLogger),
            transports: {
                Console: jest.fn()
            }
        }));

        const clearLogFile = () => {
            fakeLogFile.splice(0, fakeLogFile.length);
        }

        const logContainsOnly = (msg: string) => {
            return fakeLogFile.length == 1 && fakeLogFile[0] === msg;
        };

        const logContains = (msg: string) => {
            for (const logEntry of fakeLogFile) {
                if(logEntry === msg) {
                    return true;
                }
            }

            return false;
        };

        const getLogSize = () => {
            return fakeLogFile.length;
        };

        const isLogEmpty = () => {
            return getLogSize() == 0;
        }

        setLogger(fakeLogger);

        return {fakeLogger, fakeLogFile, clearLogFile, logContains, logContainsOnly, getLogSize, isLogEmpty}
    }

}
