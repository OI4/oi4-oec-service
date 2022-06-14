import { IContainerConfig, IContainerConfigConfigName, IContainerConfigGroupName } from './IContainer';

// Specific Container Config interfaces
export interface ISpecificContainerConfig extends IContainerConfig {
    logging: ILoggingContainerConfigGroupName;
    registry: IRegistryContainerConfigGroupName;
  }


  export interface ILoggingContainerConfigGroupName extends IContainerConfigGroupName {
    auditLevel: IContainerConfigConfigName;
    logType: IContainerConfigConfigName;
    logFileSize: IContainerConfigConfigName;
  }

  export interface IRegistryContainerConfigGroupName extends IContainerConfigGroupName {
    developmentMode: IContainerConfigConfigName;
    showRegistry: IContainerConfigConfigName;
  }
