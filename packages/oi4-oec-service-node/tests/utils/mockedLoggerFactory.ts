// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {LoggingService} from './logger.service';
import {Logger} from '@oi4/oi4-oec-service-logger';

export type LoggerItems = {
    fakeLogger: Logger;
    fakeLogFile: Array<string> ;
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

        return {fakeLogger: fakeLogger, fakeLogFile: fakeLogFile}
    }

}