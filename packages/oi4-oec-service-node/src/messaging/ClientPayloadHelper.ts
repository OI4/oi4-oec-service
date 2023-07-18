import {ValidatedPayload} from '../topic/TopicModel';
import {
    DataSetWriterIdManager,
    EDeviceHealth,
    getResource,
    Health,
    IContainerConfig,
    IEvent,
    IOI4ApplicationResources,
    IOI4Resource,
    IOPCUADataSetMessage,
    License,
    Oi4Identifier,
    OI4Payload,
    PublicationList,
    Resources,
    SubscriptionList
} from '@oi4/oi4-oec-service-model';

export class ClientPayloadHelper {

    // TODO: we can now (V1.1) see the source a Oi4Identifier only. Code needs adoptions.
    // subResource is with 1.0 still a string and not an Oi4Identifier as with 1.1
    createPayload(payload: OI4Payload, source: Oi4Identifier): IOPCUADataSetMessage {
        return {
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(payload.resourceType(), source),
            Source: source,
            Payload: payload,
        };
    };


    getHealthPayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier): ValidatedPayload {
        const health = applicationResources.getHealth(oi4Id);
        if (health === undefined) {
            return {abortSending: true, payload: undefined};
        }
        const payload: IOPCUADataSetMessage[] = [this.createPayload(health, oi4Id)];
        return {abortSending: false, payload: payload};
    }

    createMamResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier, source?: Oi4Identifier): ValidatedPayload {
        if (source) { // get mam from a specific asset
            const mam = applicationResources.getMasterAssetModel(source);
            const payload = mam !== undefined ? [this.createPayload(mam, source)]: [];
            return {abortSending: false, payload: payload};
        } else { // get all mam's
            const oi4Identifiers = [...applicationResources.sources.keys()];
            const subResourcesPayloads = oi4Identifiers.map(dnp => {
                const id = Oi4Identifier.fromDNPString(dnp);
                const mam = applicationResources.getMasterAssetModel(id);
                return this.createPayload(mam, id);
            })

            const mam = applicationResources.getMasterAssetModel(oi4Id);
            const payload = this.createPayload(mam, oi4Id);

            return {abortSending: false, payload: [payload, ...subResourcesPayloads]};
        }
    }

    createHealthStatePayload(deviceHealth: EDeviceHealth, score: number): Health {
        return new Health(deviceHealth, score);
    }

    createRTLicenseResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier): ValidatedPayload {
        const payload = [this.createPayload(applicationResources.rtLicense, oi4Id)];
        return {abortSending: false, payload: payload};
    }

    createProfileSendResourcePayload(applicationResources: IOI4ApplicationResources): ValidatedPayload {
        const payload = [this.createPayload(applicationResources.profile, applicationResources.oi4Id)];
        return {abortSending: false, payload: payload};
    }

    createLicenseTextSendResourcePayload(applicationResources: IOI4ApplicationResources, filter: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        if (!applicationResources.licenseText.has(filter)) {
            return {abortSending: true, payload: undefined};
        }
        payload.push(this.createPayload(applicationResources.licenseText.get(filter), applicationResources.oi4Id));
        return {abortSending: false, payload: payload};
    }

    // TODO Rework
    createLicenseSendResourcePayload(applicationResources: IOI4ApplicationResources, source?: Oi4Identifier, licenseId?: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        const licenses: License[] = applicationResources.getLicense(source, licenseId);

        for (const license of licenses) {
            payload.push({
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(license.resourceType(), source),
                Filter: license.LicenseId,
                Source: source ?? applicationResources.oi4Id,
                Timestamp: new Date().toISOString(),
                Payload: {Components: license.Components},
            })
        }

        return {abortSending: false, payload: payload};
    }

    createPublicationListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getPublicationList(oi4Id, resourceType, tag).map((elem: PublicationList) => {
            const resource = getResource(elem.Resource);
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id);
            return {
                DataSetWriterId: dataSetWriterId,
                Filter: resource,
                Source: applicationResources.oi4Id,
                Payload: {
                    ...elem,
                    Source: elem.Source.toString()
                },
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    createSubscriptionListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: Oi4Identifier, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getSubscriptionList(oi4Id, resourceType, tag).map((elem: SubscriptionList) => {
            const resource = Resources.SUBSCRIPTION_LIST;
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id);
            return {
                DataSetWriterId: dataSetWriterId,
                Filter: resource,
                Source: applicationResources.oi4Id,
                Payload: elem,
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    createConfigSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: Oi4Identifier, filter?: string): ValidatedPayload {

        function getFilter(config: IContainerConfig): string | undefined {
            if (config?.['context']?.Name) {
                return encodeURI(config['context'].Name.Text)
            }
        }

        function createDataSetMessage(config: IContainerConfig, oi4Id: Oi4Identifier, filter?: string): IOPCUADataSetMessage | undefined {
            if (config) {
                const configFilter = getFilter(config);
                if (filter && configFilter !== filter) { // filter is set and does not match with configuration filter
                    return;
                }
                return {
                    DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resources.CONFIG, oi4Id),
                    Filter: configFilter,
                    Source: oi4Id,
                    Payload: config
                };
            }
        }

        if (!oi4Id) { // return everything
            const messages: IOPCUADataSetMessage[] = [];
            const mainConfig = createDataSetMessage(applicationResources.config, applicationResources.oi4Id);
            if (mainConfig) {
                messages.push(mainConfig);
            }

            applicationResources.sources.forEach((value: IOI4Resource, key: string) => {
                const subConfig = createDataSetMessage(value.config, Oi4Identifier.fromDNPString(key));
                if (subConfig) {
                    messages.push(subConfig);
                }
            });

            return {abortSending: messages.length == 0, payload: messages};
        }

        // filter result
        let config: IOPCUADataSetMessage | undefined;
        if (applicationResources.oi4Id.equals(oi4Id)) {
            config = createDataSetMessage(applicationResources.config, applicationResources.oi4Id, filter);
        } else if (applicationResources.sources.has(oi4Id.toString())) {
            config = createDataSetMessage(applicationResources.sources.get(oi4Id.toString()).config, oi4Id, filter);
        }

        const messages: IOPCUADataSetMessage[] = config ? [config] : [];
        return {abortSending: messages.length == 0, payload: messages};
    }

    createPublishEventMessage(filter: string, source: Oi4Identifier, event: IEvent): IOPCUADataSetMessage[] {
        return [{
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(event.resourceType(), source),
            Filter: filter,
            Source: source,
            Timestamp: new Date().toISOString(),
            Payload: event,
        }];
    }

}
