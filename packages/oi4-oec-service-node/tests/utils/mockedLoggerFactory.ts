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
        return {fakeLogger: fakeLogger, fakeLogFile: fakeLogFile}
    }

}