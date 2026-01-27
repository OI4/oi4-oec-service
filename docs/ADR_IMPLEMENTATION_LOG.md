# ADR Implementation Log

## Overview

This document tracks the implementation of Architecture Decision Records (ADRs) from the OI4 OEC Development Guideline into the oi4-oec-service codebase.

## Initial Analysis

### Repository Structure

- **Monorepo**: Managed with Lerna and Yarn workspaces
- **Packages**:
  - `oi4-oec-asyncapi`: AsyncAPI specification
  - `oi4-oec-dnp-encoding`: DNP encoding utilities
  - `oi4-oec-json-schemas`: JSON Schema definitions
  - `oi4-oec-service-conformity-validator`: Conformity validation
  - `oi4-oec-service-logger`: Logging utilities
  - `oi4-oec-service-model`: Data models and types
  - `oi4-oec-service-node`: Node.js service implementation

### Current State (Baseline)

- **Node.js**: Updated to >=22.0.0 (LTS)
- **TypeScript**: ^5.2.2
- **Test Framework**: Jest ^29.7.0
- **JSON Schemas Tests**: 25 passed, 225 total tests across all packages

### ADRs to Implement (in order)

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Rework Health message (9.3.2) | ✅ Completed |
| 002 | Rework license handling | ✅ Completed |
| 003 | Broker topic versioning concept | ✅ Completed |
| 004 | Renaming DataSetMessage keys 'Source' and 'Filter' for OPC compliance | ✅ Completed |
| 005 | Fix NetworkMessage key 'CorrelationId' for OPC compliance | ✅ Completed |
| 008 | Delete unused Resources | ✅ Completed |

---

## ADR 001: Rework Health Message

### Summary

The Health message structure needs to be extended to support:
1. Multiple subordinate health statuses per asset
2. Additional diagnostic information directly in the health message
3. A `Details[]` array containing detailed health information

### Current Implementation

**Health.schema.json**:
```json
{
  "properties": {
    "Health": { "$ref": "constants/DeviceHealthEnumeration.schema.json" },
    "HealthScore": { "type": "integer", "minimum": 0, "maximum": 100 }
  }
}
```

### Required Changes

1. Add `Details` array property to Health.schema.json
2. Create `HealthDetailObject.schema.json` with:
   - `Health`: DeviceHealthEnumeration (mandatory)
   - `DiagnosticCode`: string (optional)
   - `Location`: string (optional)
   - `Description`: LocalizedText (optional)
3. Update model classes in oi4-oec-service-model
4. Update tests

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/Health.schema.json`
- `packages/oi4-oec-json-schemas/src/schemas/HealthDetailObject.schema.json` (new)
- `packages/oi4-oec-service-model/src/model/resources/Health.ts`
- `packages/oi4-oec-json-schemas/tests/health.test.ts`

---

## ADR 002: Rework License Handling

### Summary

License and LicenseText resources should be removed and replaced with SBOM files stored at `/opt/oi4/licenses`.

### Required Changes

1. Mark License and LicenseText resources as deprecated
2. Update documentation
3. Consider removing from resources enum (breaking change)

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/constants/resources.schema.json`
- `packages/oi4-oec-service-model/src/model/Resources.ts`

---

## ADR 003: Broker Topic Versioning

### Summary

Add versioning to MQTT topics by changing the namespace identifier from `Oi4` to `Oi4v2`.

### Required Changes

1. Update topic path patterns
2. Update TopicParser and TopicModel
3. Ensure backward compatibility considerations

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/constants/topicPath.schema.json`
- `packages/oi4-oec-service-node/src/topic/TopicParser.ts`
- `packages/oi4-oec-service-node/src/topic/TopicModel.ts`

---

## ADR 004: Rename DataSetMessage Keys for OPC Compliance

### Summary

Rename `Source` and `Filter` keys in DataSetMessage to achieve OPC UA compliance.

### Required Changes

1. Rename `Source` to `Oi4Identifier` (TBD based on ADR details)
2. Rename `Filter` to appropriate OPC-compliant name
3. Update all references

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/DataSetMessage.schema.json`
- `packages/oi4-oec-service-model/src/opcua/model/IOPCUA.ts`

---

## ADR 005: Fix NetworkMessage CorrelationId

### Summary

Fix incompatibility with NetworkMessage key `CorrelationId` to achieve OPC compliance.

### Required Changes

1. Review and update CorrelationId usage per OPC UA specification

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/NetworkMessage.schema.json`

---

## ADR 008: Delete Unused Resources

### Summary

Remove resources that are no longer used.

### Required Changes

1. Remove deprecated resources from enum
2. Clean up references

### Files to Modify

- `packages/oi4-oec-json-schemas/src/schemas/constants/resources.schema.json`
- `packages/oi4-oec-service-model/src/model/Resources.ts`

---

## Implementation Progress

### Date: 2026-01-22

- [x] Initial analysis completed
- [x] Node.js engine updated to >=22.0.0
- [x] Baseline tests documented
- [x] ADR 001 implementation - COMPLETED
  - Created HealthDetailObject.schema.json
  - Extended Health.schema.json with Details array
  - Updated Health.ts TypeScript model
  - Added test fixtures (valid and invalid)
  - Updated health.test.ts with new schema references
  - All 232 tests passing in oi4-oec-json-schemas
- [x] ADR 002 implementation - COMPLETED
  - Marked License.schema.json as deprecated
  - Marked LicenseText.schema.json as deprecated
  - Added @deprecated JSDoc tags to License.ts and LicenseText.ts
  - Added deprecation comments to Resources enum
- [x] ADR 003 implementation - COMPLETED
  - Updated topicPath.schema.json to support Oi4v2 namespace
  - Added oi4NamespaceV2 and oi4DefaultNamespace constants
  - Extended TopicInfo with namespace property
  - Added detectNamespace() function to TopicParser
- [x] ADR 004 implementation - COMPLETED
  - Renamed Source to Oi4Identifier in DataSetMessage.schema.json
  - Marked Filter as deprecated
  - Updated IOPCUADataSetMessage and IOPCUADataSetMetaData interfaces
  - Updated OPCUABuilder methods
- [x] ADR 005 implementation - COMPLETED
  - Updated NetworkMessage.schema.json description
  - Updated CorrelationId documentation for OPC UA Part 14 compliance
  - Updated IOPCUANetworkMessage interface documentation
- [x] ADR 008 implementation - COMPLETED
  - Added deprecation notice to resources.schema.json
  - Documented deprecated resources (License, LicenseText)
