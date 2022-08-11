export enum EAssetType {
  device = 'device',
  application = 'application'
}

export enum ESubResource {
  syslog = 'syslog',
  opcSC = 'opcSC',
  ne107 = 'ne107',
  generic = 'generic',
}

export enum EGenericEventFilter {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export enum ESyslogEventFilter {
  emergency = 'emergency',
  alert = 'alert',
  critical = 'critical',
  error = 'error',
  warning = 'warning',
  notice = 'notice',
  informational = 'informational',
  debug = 'debug',
}

export enum ENamurEventFilter {
  normal = 'normal',
  failure = 'failure',
  checkFunction = 'checkFunction',
  outOfSpecification = 'outOfSpecification',
  maintenanceRequired = 'maintenanceRequired',
}

export enum EOpcUaEventFilter {
  good = 'good',
  uncertain = 'uncertain',
  bad = 'bad',
}

export enum EDeviceHealth {
  NORMAL_0 = 'NORMAL_0',
  FAILURE_1 = 'FAILURE_1',
  CHECK_FUNCTION_2 = 'CHECK_FUNCTION_2',
  OFF_SPEC_3 = 'OFF_SPEC_3',
  MAINTENANCE_REQUIRED_4 = 'MAINTENANCE_REQUIRED_4',
}
