import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import { OPCUABuilder } from '../OPCUABuilder/index';
import { ESubResource } from '../../Models/IContainer';

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
  private _level: ESubResource; /*tslint:disable-line*/
  private _name: string; /*tslint:disable-line*/
  private _mqttClient?: mqtt.AsyncClient;
  private _oi4Id?: string;
  private _serviceType?: string;
  private _builder?: OPCUABuilder;
  private readonly topicToEnum = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  };

  constructor(enabled: boolean = true, name: string, level: ESubResource = ESubResource.info, mqttClient?: mqtt.AsyncClient, oi4Id?: string, serviceType?: string) {
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
    if (typeof lvl !== 'string') throw new Error('level must be of type string/ESubResource String');
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
  log(logstring: string, level = ESubResource.trace) {
    if (this.enabled) {
      if (this.topicToEnum[level] >= this.topicToEnum[this.level]) {
        console.log(`${this._name}: ${logstring}`); // eslint-disable-line no-console
        if (this._mqttClient) {
          let logPayload;
          if (this._builder) {
            logPayload = this._builder.buildOPCUADataMessage({
              number: 0,
              description: logstring,
              payload: {
                logLevel: level,
                logOrigin: this._name,
              },
            }, new Date(), '543ae05e-b6d9-4161-a0a3-350a0fac5976'); /*tslint:disable-line*/
          }
          /* Optimistic log...if we want to be certain, we have to convert this to async */
          this._mqttClient.publish(`oi4/${this._serviceType}/${this._oi4Id}/pub/event/${level}/${this._oi4Id}`, JSON.stringify(logPayload));
        }
      }
    }
    return logstring;
  }
}
export { Logger };
