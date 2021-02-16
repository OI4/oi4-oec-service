import fs = require('fs');
import path = require('path');

import { IContainerConfig } from '../../Container/index';
import { EventEmitter } from 'events';

/**
 * Responsible for reading / writing configuration data to a containerConfig.json file (currently hardcoded name and path)
 */
// TODO: Is this even needed???
class ConfigParser extends EventEmitter {
  private _config: IContainerConfig;
  private configPath: string = path.join(__dirname, '..', '..', '..', 'Config', 'containerConfig.json');
  constructor() {
    super();
    this._config = {
      updateInterval: 1337,
      textColor: 'white',
    };
    const initData = fs.readFileSync(this.configPath);
    this._config = JSON.parse(initData.toString());
  }

  /**
   * Set config from Parameter to containerConfig.json
   */
  set config(newConfig: IContainerConfig) {
    fs.writeFileSync(this.configPath, Buffer.from(JSON.stringify(newConfig)));
    this._config = newConfig;
  }

  /**
   * Retrieve current config from JSON
   */
  get config() {
    const getConfigData = fs.readFileSync(this.configPath);
    // TODO: Remove this level of complexity and reduce to one line
    const getConfigString = getConfigData.toString();
    const getConfigObj = JSON.parse(getConfigString);
    this._config = getConfigObj;
    return this._config;
  }

  static parseGenericJSON(filePath: string) {
    const getJSONData = fs.readFileSync(filePath);
    const getJSONString = getJSONData.toString();
    const getJSONObj = JSON.parse(getJSONString);
    return getJSONObj;
  }
}

export { ConfigParser };
