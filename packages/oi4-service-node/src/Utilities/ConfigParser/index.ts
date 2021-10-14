import fs = require('fs');
import path = require('path');

import { EventEmitter } from 'events';
import { ISpecificContainerConfig } from '../../Config/IContainerConfig';

/**
 * Responsible for reading / writing configuration data to a containerConfig.json file (currently hardcoded name and path)
 */
// TODO: Is this even needed???
class ConfigParser extends EventEmitter {
  private _config: ISpecificContainerConfig;
  private configPath: string = path.join(__dirname, '..', '..', 'Config', 'containerConfig.json');
  constructor() {
    super();
    // this._config = {
    //   logging: {
    //     name: {
    //       locale: EOPCUALocale.enUS,
    //       text: 'Logging'
    //     },
    //     description: {
    //       locale: EOPCUALocale.enUS,
    //       text: 'Everything related to logging',
    //     },
    //     auditLevel: {
    //       name: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Audit Level',
    //       },
    //       description: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Audit Level, use Syslog Enum entries only!'
    //       },
    //       value: 'warning',
    //       type: EOPCUABaseDataType.String,
    //     },
    //     logType: {
    //       name: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Logging type',
    //       },
    //       description: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Currently used to enable / disable log to storage. Enum'
    //       },
    //       value: 'disabled',
    //       type: EOPCUABaseDataType.String,
    //     },
    //     logFileSize: {
    //       name: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Size of Logfile (bytes)',
    //       },
    //       description: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'After this size, the logfile will cycle to the next one'
    //       },
    //       value: 250000,
    //       type: EOPCUABaseDataType.Number,
    //       unit: 'byte',
    //     },
    //   },
    //   registry: {
    //     name: {
    //       locale: EOPCUALocale.enUS,
    //       text: 'Registry',
    //     },
    //     description: {
    //       locale: EOPCUALocale.enUS,
    //       text: 'Everything related to registry specific config'
    //     },
    //     developmentMode: {
    //       name: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Development mode',
    //       },
    //       description: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Enables or disables the development mode of the frontend',
    //       },
    //       value: false,
    //       type: EOPCUABaseDataType.Boolean,
    //     },
    //     showRegistry: {
    //       name: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Show Registry',
    //       },
    //       description: {
    //         locale: EOPCUALocale.enUS,
    //         text: 'Decides, whether to save the Registry along the other assets or not',
    //       },
    //       value: true,
    //       type: EOPCUABaseDataType.Boolean,
    //     }
    //   }
    // };
    this._config = this.readConfig();
  }

  /**
   * Set config from Parameter to containerConfig.json
   */
  set config(newConfig: ISpecificContainerConfig) {
    this.writeConfig(newConfig);
    const oldConfig = JSON.parse(JSON.stringify(this._config));
    this._config = newConfig;
    this.emit('newConfig', oldConfig);
  }

  private writeConfig(newConfig: ISpecificContainerConfig) {
    fs.writeFileSync(this.configPath, Buffer.from(JSON.stringify(newConfig, null, 4)));
  }

  public readConfig(): ISpecificContainerConfig {
    const getConfigData = fs.readFileSync(this.configPath);
    // TODO: Remove this level of complexity and reduce to one line
    const getConfigString = getConfigData.toString();
    const getConfigObj = JSON.parse(getConfigString);
    return getConfigObj;
  }

  /**
   * Retrieve current config from JSON
   */
  get config() {
    this._config = this.readConfig();
    return this._config;
  }
}

export { ConfigParser };
