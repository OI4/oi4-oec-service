export enum EAssetType {
    device = 'device',
    application = 'application,'
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
  
  export enum EPublicationListExplicit {
    EXPL_OFF_0 = 'EXPL_OFF_0',
    EXPL_TAG_1 = 'EXPL_TAG_1',
    EXPL_DSWID_2 = 'EXPL_DSWID_2',
    EXPL_TAG_AND_DSWID_3 = 'EXPL_TAG_AND_DSWID_3'
  }
  
  export enum EPublicationListConfig {
    NONE_0 = 'NONE_0',
    STATUS_1 = 'STATUS_1',
    INTERVAL_2 = 'INTERVAL_2',
    STATUS_AND_INTERVAL_3 = 'STATUS_AND_INTERVAL_3',
  }
  
  export enum ESubscriptionListConfig {
    NONE_0 = 'NONE_0',
    CONF_1 = 'CONF_1',
  }
  