import { IContainerConfigConfigName, IContainerConfigGroupName } from './IContainer';

  export interface ILoggingContainerConfigGroupName extends IContainerConfigGroupName {
    auditLevel: IContainerConfigConfigName;
    logType: IContainerConfigConfigName;
    logFileSize: IContainerConfigConfigName;
  }

  export interface IRegistryContainerConfigGroupName extends IContainerConfigGroupName {
    developmentMode: IContainerConfigConfigName;
    showRegistry: IContainerConfigConfigName;
  }
