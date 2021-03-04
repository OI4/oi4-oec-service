import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import { OPCUABuilder } from '../OPCUABuilder/index';
import { EContainerEventCategory, EGenericEventFilter, ESubResource, IContainerEvent } from '../../Models/IContainer';

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

  private _enabled: boolean; /*tslint:disable-line*/
  private _level: EGenericEventFilter; /*tslint:disable-line*/
  private _name: string; /*tslint:disable-line*/
  private _mqttClient?: mqtt.AsyncClient;
  private _oi4Id?: string;
  private _serviceType?: string;
  private _builder?: OPCUABuilder;
  private readonly genericFilterToEnum = {
    low: 0,
    medium: 1,
    high: 2,
  };

  private readonly categoryToTopic = {
    CAT_SYSLOG_0: 'syslog',
    CAT_OPCSC_1: 'opcSC',
    CAT_NE107_2: 'ne107',
    CAT_GENERIC_99: 'generic',
  }

  constructor(enabled: boolean = true, name: string, level: EGenericEventFilter = EGenericEventFilter.medium, mqttClient?: mqtt.AsyncClient, oi4Id?: string, serviceType?: string) {
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
     * The name of the logger
     * @type {string}
     */
    this._name = name;

    if (mqttClient) {
      this._mqttClient = mqttClient;
    }
    if (oi4Id) {
      this._oi4Id = oi4Id;
      this._builder = new OPCUABuilder(oi4Id, 'Registry');
    }
    if (serviceType) {
      this._serviceType = serviceType;
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(en: boolean) {
    if (typeof en !== 'boolean') throw new Error('enabled must be of type Boolean');
    this._enabled = en;
  }

  get level() {
    return this._level;
  }

  set level(lvl) {
    if (typeof lvl !== 'string') throw new Error('level must be of type string/EGenericFilter String');
    console.log(`Set logger level of ${this._name} level to: ${lvl}`);
    this._level = lvl;
  }

  get name() {
    return this._level;
  }

  set name(newname) {
    if (typeof newname !== 'string') throw new Error('name must be of type string');
    this._name = newname;
  }

  /**
   * Wrapper for console.log()
   * @param {string} logstring - string that is to be logged to the console
   * @param {string} color - either the chalk-color or the abbreviated version (e.g 'r' = chalk.red)
   * @param {number} level - the level that the log is to be logged to
   */
  log(logstring: string, level = EGenericEventFilter.low, category: EContainerEventCategory = EContainerEventCategory.CAT_GENERIC_99,) {
    if (this.enabled) {
      if (this.genericFilterToEnum[level] >= this.genericFilterToEnum[this.level]) {
        console.log(`${this._name}: ${logstring}`); // eslint-disable-line no-console
        if (this._mqttClient) {
          let logDataMessage;
          if (this._builder) {
            const logPayload: IContainerEvent = {
              category: category,
              number: 0,
              description: logstring,
              details: {
                logLevel: level,
                logOrigin: this._name,
              }
            };
            logDataMessage = this._builder.buildOPCUADataMessage([{ payload: logPayload }], new Date(), '543ae05e-b6d9-4161-a0a3-350a0fac5976'); /*tslint:disable-line*/
          }
          const topicCategory = this.categoryToTopic[category];
          /* Optimistic log...if we want to be certain, we have to convert this to async */
          this._mqttClient.publish(`oi4/${this._serviceType}/${this._oi4Id}/pub/event/${topicCategory}/${level}/${this._oi4Id}`, JSON.stringify(logDataMessage));
        }
      }
    }
    return logstring;
  }
}
export { Logger };
