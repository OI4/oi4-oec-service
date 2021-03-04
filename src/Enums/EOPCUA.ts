export enum EOPCUALocale {
    enUS = 'en-US',
  }
  
  export enum EOPCUAMessageType {
    uadata = 'ua-data',
    uametadata = 'ua-metadata',
  }
  
  export enum EOPCUABuiltInType {
    Boolean = 1,
    SByte = 2,
    Byte = 3,
    Int16 = 4,
    UInt16 = 5,
    Int32 = 6,
    UInt32 = 7,
    Int64 = 8,
    UIn64 = 9,
    Float = 10,
    Double = 11,
    String = 12,
    DateTime = 13,
    Guid = 14,
    ByteString = 15,
    XmlElement = 16,
    NodeId = 17,
    ExpandedNodeId = 18,
    StatusCode = 19,
    QualifiedName = 20,
    LocalizedText = 21,
    ExtensionObject = 22,
    DataValue = 23,
    Variant = 24,
    DiagnosticInfo = 25,
  }
  
  export enum EOPCUABaseDataType { // TODO: Needs to be expanded
    Boolean = 'Boolean',
    ByteString = 'ByteString',
    DateTime = 'DateTime',
    Number = 'Number',
    String = 'String',
  }
  
  export enum EOPCUAValueRank {
    Any = -2,
    Scalar = -1,
    ArrayAny = 0,
    Array = 1,
    Matrix = 2,
  }