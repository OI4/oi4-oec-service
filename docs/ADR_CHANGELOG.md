# ADR Changelog

All notable changes related to Architecture Decision Record (ADR) implementations are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### ADR 001 - Rework Health Message (9.3.2)

**Status**: Completed

**Summary**: Extended the Health message structure to support multiple subordinate health statuses and additional diagnostic information.

**Changes**:
- Added `HealthDetailObject.schema.json` - new schema for detail objects
- Extended `Health.schema.json` with optional `Details` array
- Updated `Health.ts` model with `HealthDetailObject` interface
- Added test fixtures for Details array functionality

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/Health.schema.json`
- `packages/oi4-oec-json-schemas/src/schemas/HealthDetailObject.schema.json` (new)
- `packages/oi4-oec-json-schemas/src/index.ts`
- `packages/oi4-oec-service-model/src/model/resources/Health.ts`
- `packages/oi4-oec-json-schemas/tests/__fixtures__/healths_valid.json`
- `packages/oi4-oec-json-schemas/tests/__fixtures__/healths_invalid.json`
- `packages/oi4-oec-json-schemas/tests/health.test.ts`

**Migration Notes**:
- The `Details` property is optional, existing Health messages remain valid
- `HealthScore` is now optional (was implicitly required before)
- New `HealthDetailObject` structure supports: Health (required), DiagnosticCode, Location, Description

**Tests Added**:
- 4 new valid test cases for Details array
- 3 new invalid test cases for Details validation
- Total: 20 health tests passing

---

### ADR 002 - Rework License Handling

**Status**: Completed

**Summary**: License and LicenseText resources are deprecated in favor of SBOM files stored at `/opt/oi4/licenses`.

**Changes**:
- Marked `License.schema.json` as deprecated
- Marked `LicenseText.schema.json` as deprecated  
- Added `@deprecated` JSDoc tags to `License.ts` and `LicenseText.ts` models
- Added deprecation comments to `Resources.LICENSE` and `Resources.LICENSE_TEXT` enum values

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/License.schema.json`
- `packages/oi4-oec-json-schemas/src/schemas/LicenseText.schema.json`
- `packages/oi4-oec-service-model/src/model/resources/License.ts`
- `packages/oi4-oec-service-model/src/model/resources/LicenseText.ts`
- `packages/oi4-oec-service-model/src/model/Resources.ts`

**Migration Notes**:
- License information should now be provided via SBOM files (SPDX or CycloneDX format)
- SBOM files must be placed at `/opt/oi4/licenses` mount path
- The License and LicenseText resources remain functional but are deprecated
- Future versions will remove these resources entirely

**Tests Added**:
- No new tests required (deprecation is documentation-only change)

---

### ADR 003 - Broker Topic Versioning

**Status**: Completed

**Summary**: Added versioning to MQTT topics by changing namespace from `Oi4` to `Oi4v2`.

**Changes**:
- Updated `topicPath.schema.json` pattern to support both `Oi4` and `Oi4v2` namespaces
- Added `oi4NamespaceV2` and `oi4DefaultNamespace` constants to `TopicModel.ts`
- Extended `TopicInfo` class with `namespace` property
- Extended `TopicInfoBuilder` with `namespace()` method
- Added `detectNamespace()` function to `TopicParser.ts`
- Updated `extractCommonInfo()` to parse and store namespace version

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/constants/topicPath.schema.json`
- `packages/oi4-oec-service-node/src/topic/TopicModel.ts`
- `packages/oi4-oec-service-node/src/topic/TopicParser.ts`

**Migration Notes**:
- New implementations should use `oi4NamespaceV2` (`Oi4v2`) namespace
- Legacy `Oi4` namespace is still supported for backward compatibility
- The `TopicInfo.namespace` property indicates which version a message uses
- Default namespace for new topic publications is `Oi4v2`

**Tests Added**:
- Existing topic tests cover basic functionality
- Additional tests recommended for namespace version detection

---

### ADR 004 - Rename DataSetMessage Keys for OPC Compliance

**Status**: Completed

**Summary**: Renamed `Source` and `Filter` keys in DataSetMessage to achieve OPC UA compliance.

**Changes**:
- Renamed `Source` property to `Oi4Identifier` in `DataSetMessage.schema.json`
- Marked `Filter` property as deprecated in the schema
- Updated `IOPCUADataSetMessage` interface with renamed property
- Updated `IOPCUADataSetMetaData` interface with renamed property
- Updated `OPCUABuilder.ts` methods to use `Oi4Identifier`
- Updated JSDoc comments to reflect the change

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/DataSetMessage.schema.json`
- `packages/oi4-oec-service-model/src/opcua/model/IOPCUA.ts`
- `packages/oi4-oec-service-model/src/opcua/OPCUABuilder.ts`

**Migration Notes**:
- Replace all usages of `Source` property with `Oi4Identifier` in DataSetMessage objects
- The `Filter` property is now deprecated and may be removed in future versions
- Update any code that accesses `message.Source` to use `message.Oi4Identifier`

**Tests Added**:
- Existing tests updated for new property name
- Schema validation tests cover the renamed property

---

### ADR 005 - Fix NetworkMessage CorrelationId

**Status**: Completed

**Summary**: Fixed incompatibility with NetworkMessage key `CorrelationId` for OPC UA Part 14 compliance.

**Changes**:
- Updated `NetworkMessage.schema.json` description to reflect OPC UA Part 14 specification
- Updated `CorrelationId` property description to clarify its purpose in request-response matching
- Updated `IOPCUANetworkMessage` interface with proper JSDoc documentation
- Removed outdated TODO comments

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/NetworkMessage.schema.json`
- `packages/oi4-oec-service-model/src/opcua/model/IOPCUA.ts`

**Migration Notes**:
- No breaking changes - CorrelationId remains optional
- Updated documentation clarifies that CorrelationId is used for request-response correlation
- Follows OPC UA Part 14-7.2.2.1 specification

**Tests Added**:
- Existing NetworkMessage tests remain valid
- No new tests required (documentation-only changes)

---

### ADR 008 - Delete Unused Resources

**Status**: Completed

**Summary**: Marked deprecated resources for future removal.

**Changes**:
- Added deprecation notice to `resources.schema.json`
- Added `$comment` field documenting deprecated resources
- License and LicenseText resources are marked for deprecation (per ADR 002)
- Resources remain in enum for backward compatibility

**Files Modified**:
- `packages/oi4-oec-json-schemas/src/schemas/constants/resources.schema.json`

**Migration Notes**:
- License and LicenseText resources are deprecated but still valid
- Applications should migrate to SBOM files at `/opt/oi4/licenses` (per ADR 002)
- Future versions may remove deprecated resources entirely

**Tests Added**:
- No new tests required (deprecation markers only)
- Existing resource validation tests remain valid
