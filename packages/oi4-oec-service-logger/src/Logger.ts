import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import {
    DataSetClassIds,
    DataSetWriterIdManager,
    ESyslogEventFilter,
    EventCategory,
    Oi4Identifier,
    OPCUABuilder,
    Resources,
    ServiceTypes,
    SyslogEvent
} from '@oi4/oi4-oec-service-model';
import winston, {Logger as WinstonLogger, transports} from 'winston';
import {Syslog, SyslogTransportInstance} from 'winston-syslog';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore TODO: this lib does not have any typings, but the api is simple enough
const glossyParser = require('glossy').Parse;

/**
 * Logger implementation.<br>
 * Adds several logging options, including levels and colors of the logs
 */
class Logger {
    /**
     * Constructor of the logger
     * @param {boolean} enabled - enables or disables logging
     * @param {number} level  - sets the minimum logging level
     */
    private readonly _syslogTransport: SyslogTransportInstance;
    private _winstonLogger: WinstonLogger;
    private _enabled: boolean; /*tslint:disable-line*/
    private _level: ESyslogEventFilter; /*tslint:disable-line*/
    private _publishLevel: ESyslogEventFilter; /*tslint:disable-line*/
    private _name: string; /*tslint:disable-line*/
    private _mqttClient?: mqtt.AsyncClient;
    private readonly _oi4Id?: Oi4Identifier;
     private readonly _serviceType?: string;
    private readonly _builder?: OPCUABuilder;
    private readonly syslogFilterToEnum = {
        debug: 7,
        informational: 6,
        notice: 5,
        warning: 4,
        error: 3,
        critical: 2,
        alert: 1,
        emergency: 0,
    }
    private readonly syslogToWinston: { [index: string]: string } = {
        debug: 'debug',
        informational: 'info',
        notice: 'info',
        warning: 'warn',
        error: 'error',
        critical: 'error',
        alert: 'error',
        emergency: 'error',
    }

    constructor(enabled = true, name: string, level = ESyslogEventFilter.warning, publishLevel = ESyslogEventFilter.warning, oi4Id: Oi4Identifier, serviceType: ServiceTypes, mqttClient?: mqtt.AsyncClient) {
        /**
         * Enables or disables the logging. Default: `true`
         * @type {boolean}
         */
        this._enabled = enabled;

        /**
         * The minimum level needed for the log to appear on the console.
         * @type {number}
         */
        this._level = level;

        /**
         * The minimum level needed for the log to appear on the console.
         * @type {number}
         */
        this._publishLevel = publishLevel;

        /**
         * The name of the logger
         * @type {string}
         */
        this._name = name;

        if (mqttClient) {
            this._mqttClient = mqttClient;
        }

        // Ignore the maximumPackageSize argument of the builder, because we only use the builder to create messages that contain one event.
        // A message with one event cannot be split into smaller messages and shall never exceed the maximum package size.
        this._builder = new OPCUABuilder(oi4Id, serviceType);
        this._oi4Id = oi4Id;
        this._serviceType = serviceType;

        this._syslogTransport = new Syslog({type: '5424'});
        this._winstonLogger = winston.createLogger({
            //levels: winston.config.syslog.levels,
            transports: [
                new transports.Console(),
                this._syslogTransport,
            ]
        })
        this._winstonLogger.on('data', (data) => {
            const prod = this._syslogTransport.producer
            const msg = prod.produce({
                severity: data.level,
                host: 'localhost',
                date: new Date(),
                message: data.message,
            });
            glossyParser.parse(msg, (parsedMessage: any) => {
                if (this._builder) {
                    const event : SyslogEvent = new SyslogEvent(parsedMessage.prival);
                    event.Category = EventCategory.CAT_SYSLOG_0,
                    event.Details = {
                        MSG: parsedMessage.message,
                        HEADER: `${parsedMessage.time.toISOString()} ${parsedMessage.host}`,
                    };

                    const syslogDataMessage = this._builder.buildOPCUANetworkMessage([{
                         Source: oi4Id,
                         Payload: event,
                         DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, oi4Id),
                     }], new Date(),  DataSetClassIds.Event); /*tslint:disable-line*/
                    if (this._mqttClient) {
                        /* Optimistic log...if we want to be certain, we have to convert this to async */
                        this._mqttClient.publish(
                             `Oi4/${this._serviceType}/${this._oi4Id}/Pub/Event/${this._oi4Id}/${EventCategory.CAT_SYSLOG_0}/${data.level}`,
                             JSON.stringify(syslogDataMessage)
                        );
                    }
                }
            });

        });
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(en: boolean) {
        if (typeof en !== 'boolean') throw new Error('enabled must be of type Boolean');
        this._enabled = en;
    }

    get level(): ESyslogEventFilter {
        return this._level;
    }

    set level(lvl) {
        if (typeof lvl !== 'string') throw new Error('level must be of type string/ESyslogLevel String');
        console.log(`Set logger level of ${this._name} level to: ${lvl}`);
        this._level = lvl;
    }

    get publishLevel(): ESyslogEventFilter {
        return this._publishLevel;
    }

    set publishLevel(lvl) {
        if (typeof lvl !== 'string') throw new Error('publishing level must be of type string/ESyslogLevel String');
        console.log(`Set logger publishing level of ${this._name} level to: ${lvl}`);
        this._publishLevel = lvl;
    }

    get name(): ESyslogEventFilter {
        return this._level;
    }

    set name(name) {
        if (typeof name !== 'string') throw new Error('name must be of type string');
        this._name = name;
    }

    set mqttClient(client: mqtt.AsyncMqttClient) {
        this._mqttClient = client;
    }

    log(logString: string, level: ESyslogEventFilter = ESyslogEventFilter.debug): string {
        if (this.enabled) {
            if (this.syslogFilterToEnum[level] <= this.syslogFilterToEnum[this.level]) {
                console.log(logString);
            }
            if (this.syslogFilterToEnum[level] <= this.syslogFilterToEnum[this.publishLevel]) {
                this._winstonLogger.log(this.syslogToWinston[level], `${this._name}: ${logString}`);
            }
        }
        return logString;
    }
}


let log: Logger;
let logger: Readonly<Logger> = log;

function initializeLogger(enabled = true, name: string, level = ESyslogEventFilter.warning, publishLevel = ESyslogEventFilter.warning, oi4Id: Oi4Identifier, serviceType: ServiceTypes, mqttClient?: mqtt.AsyncClient): void {
    log = new Logger(enabled, name, level, publishLevel, oi4Id, serviceType, mqttClient);
    logger = log;
}

function updateMqttClient(client: mqtt.AsyncClient): void {
    log.mqttClient = client;
}

function setLogger(newLogger: Logger): void {
    log = newLogger;
    logger = log;
}

export {logger, Logger, initializeLogger, updateMqttClient, setLogger};
