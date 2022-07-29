import {ValidatedPayload} from './Types';
import {
    DataSetWriterIdManager,
    EDeviceHealth,
    getResource,
    Health,
    IEvent,
    IOI4ApplicationResources,
    License,
    OI4Payload,
    PublicationList,
    Resource,
    SubscriptionList,
    IContainerConfig,
} from '@oi4/oi4-oec-service-model';
import {IOPCUADataSetMessage} from '@oi4/oi4-oec-service-opcua-model';
import { IOI4Resource } from '@oi4/oi4-oec-service-model';

export class ClientPayloadHelper {

    createPayload(payload: OI4Payload, subResource: string): IOPCUADataSetMessage {
        return {
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(payload.resourceType(), subResource),
            subResource: subResource,
            Payload: payload,
        };
    };


    getHealthPayload(applicationResources: IOI4ApplicationResources, oi4Id: string): ValidatedPayload {
        const health = applicationResources.getHealth(oi4Id);
        if(health === undefined) {
            return {abortSending: true, payload: undefined};
        }
        const payload: IOPCUADataSetMessage[] = [this.createPayload(health, oi4Id)];
        return {abortSending: false, payload: payload};
    }

    createMamResourcePayload(applicationResources: IOI4ApplicationResources, subResource: string): ValidatedPayload {
        const mam = applicationResources.getMasterAssetModel(subResource);
        const payload = [this.createPayload(mam, subResource)];
        return {abortSending: false, payload: payload};
    }

    createHealthStatePayload(deviceHealth: EDeviceHealth, score: number): Health {
        return new Health(deviceHealth, score);
    }

    createRTLicenseResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: string): ValidatedPayload {
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
    createLicenseSendResourcePayload(applicationResources: IOI4ApplicationResources, subResource?: string, licenseId?: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        const licenses: License[] = applicationResources.getLicense(subResource, licenseId);

        for (const license of licenses) {
            payload.push({
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(license.resourceType(), subResource),
                filter: license.licenseId,
                subResource: subResource ?? applicationResources.oi4Id,
                Timestamp: new Date().toISOString(),
                Payload: {components: license.components},
            })
        }

        return {abortSending: false, payload: payload};
    }

    createPublicationListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: string, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getPublicationList(oi4Id, resourceType, tag).map((elem: PublicationList) => {
            const resource = getResource(elem.resource);
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id);
            return {
                DataSetWriterId: dataSetWriterId,
                filter: resource,
                subResource: applicationResources.oi4Id,
                Payload: elem,
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    createSubscriptionListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: string, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getSubscriptionList(oi4Id, resourceType, tag).map((elem: SubscriptionList) => {
            const resource = Resource.SUBSCRIPTION_LIST;
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id);
            return {
                DataSetWriterId: dataSetWriterId,
                filter: resource,
                subResource: applicationResources.oi4Id,
                Payload: elem,
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    createConfigSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: string, filter?: string): ValidatedPayload {
        
        function createDataSetMessages(config: IContainerConfig, oi4Id: string, filter?: string): IOPCUADataSetMessage[] {
            const result: IOPCUADataSetMessage[] = [];
            if (config) {
                for (const c in config) {
                    if (filter && c !== filter) {
                        continue;
                    }

                    result.push({
                        DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, oi4Id),
                        filter: c,
                        subResource: oi4Id,
                        Payload: config[c]
                    })
                }
            }
            return result;
        }

        if (!oi4Id) { // return everything
            let messages = createDataSetMessages(applicationResources.config, applicationResources.oi4Id);
            applicationResources.subResources.forEach((value: IOI4Resource, key: string ) => {
                const subResourceMessages = createDataSetMessages(value.config, key);
                messages = messages.concat(subResourceMessages);
            });

            return {abortSending: messages.length == 0, payload: messages};
        }

        // filter result
        let messages: IOPCUADataSetMessage[] = [];
        if (applicationResources.oi4Id == oi4Id) {
            messages = createDataSetMessages(applicationResources.config, applicationResources.oi4Id, filter);
        } else if (applicationResources.subResources.has(oi4Id)) {
            messages = createDataSetMessages(applicationResources.subResources.get(oi4Id).config, oi4Id, filter);
        }

        return {abortSending: messages.length == 0, payload: messages};
    }

    createPublishEventMessage(filter: string, subResource: string, event: IEvent): IOPCUADataSetMessage[] {
        return [{
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(event.resourceType(), subResource),
            filter: filter,
            subResource: subResource,
            Timestamp: new Date().toISOString(),
            Payload: event,
        }];
    }

}
