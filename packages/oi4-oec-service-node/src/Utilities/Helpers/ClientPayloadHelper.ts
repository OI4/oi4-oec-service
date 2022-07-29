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
} from '@oi4/oi4-oec-service-model';
import {IOPCUADataSetMessage, Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';

export class ClientPayloadHelper {

    // subResource is with 1.0 still a string and not an Oi4Identifier as with 1.1
    createPayload(payload: OI4Payload, subResource: string): IOPCUADataSetMessage {
        return {
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(payload.resourceType(), subResource),
            subResource: subResource,
            Payload: payload,
        };
    };


    getHealthPayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier): ValidatedPayload {
        const health = applicationResources.getHealth(oi4Id);
        if (health === undefined) {
            return {abortSending: true, payload: undefined};
        }
        const payload: IOPCUADataSetMessage[] = [this.createPayload(health, oi4Id.toString())];
        return {abortSending: false, payload: payload};
    }

    createMamResourcePayload(applicationResources: IOI4ApplicationResources, subResource: string): ValidatedPayload {
        const mam = applicationResources.getMasterAssetModel(Oi4Identifier.fromString(subResource));
        const payload = [this.createPayload(mam, subResource)];
        return {abortSending: false, payload: payload};
    }

    createHealthStatePayload(deviceHealth: EDeviceHealth, score: number): Health {
        return new Health(deviceHealth, score);
    }

    createRTLicenseResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier): ValidatedPayload {
        const payload = [this.createPayload(applicationResources.rtLicense, oi4Id.toString())];
        return {abortSending: false, payload: payload};
    }

    createProfileSendResourcePayload(applicationResources: IOI4ApplicationResources): ValidatedPayload {
        const payload = [this.createPayload(applicationResources.profile, applicationResources.oi4Id.toString())];
        return {abortSending: false, payload: payload};
    }

    createLicenseTextSendResourcePayload(applicationResources: IOI4ApplicationResources, filter: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        if (!applicationResources.licenseText.has(filter)) {
            return {abortSending: true, payload: undefined};
        }
        payload.push(this.createPayload(applicationResources.licenseText.get(filter), applicationResources.oi4Id.toString()));
        return {abortSending: false, payload: payload};
    }

    // TODO Rework
    createLicenseSendResourcePayload(applicationResources: IOI4ApplicationResources, subResource?: string, licenseId?: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        const licenses: License[] = applicationResources.getLicense(Oi4Identifier.fromString(subResource), licenseId);

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

    createPublicationListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id: Oi4Identifier, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getPublicationList(oi4Id, resourceType, tag).map((elem: PublicationList) => {
            const resource = getResource(elem.resource);
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id.toString());
            return {
                DataSetWriterId: dataSetWriterId,
                filter: resource,
                subResource: applicationResources.oi4Id.toString(),
                Payload: elem,
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    createSubscriptionListSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: Oi4Identifier, filter?: string, tag?: string): ValidatedPayload {
        const resourceType = filter !== undefined ? getResource(filter) : undefined;

        const payload: IOPCUADataSetMessage[] = applicationResources.getSubscriptionList(oi4Id, resourceType, tag).map((elem: SubscriptionList) => {
            const resource = Resource.SUBSCRIPTION_LIST;
            const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(resource, applicationResources.oi4Id.toString());
            return {
                DataSetWriterId: dataSetWriterId,
                filter: resource,
                subResource: applicationResources.oi4Id.toString(),
                Payload: elem,
            } as IOPCUADataSetMessage;
        });

        return {abortSending: payload.length == 0, payload: payload};
    }

    // TODO this method must be refactored
    createConfigSendResourcePayload(applicationResources: IOI4ApplicationResources, oi4Id?: string, filter?: string): ValidatedPayload {
        console.log(`createConfigSendResourcePayload called with oi4Id: ${oi4Id} and filter: ${filter} from ${applicationResources.oi4Id}`);
        return {abortSending: true, payload: undefined};
        // const actualPayload: IContainerConfig = (applicationResources as any)[subResource];
        // const payload: IOPCUADataSetMessage[] = [];
        //
        // // Send all configs out
        // if (filter === '') {
        //
        //     payload.push({
        //         subResource: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
        //         Payload: actualPayload,
        //         DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
        //     });
        //     return {abortSending: false, payload: payload};
        //
        //     // Send only filtered config out
        // } else if (filter === actualPayload.context.name.text.toLowerCase().replace(' ', '')) {
        //
        //     // Filtered by subResource
        //     actualPayload[filter] = applicationResources['config'][filter];
        //     payload.push({
        //         subResource: filter,
        //         Payload: actualPayload,
        //         DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
        //     });
        //     return {abortSending: false, payload: payload};
        //
        // } else if (Number.isNaN(dataSetWriterIdFilter)) {
        //
        //     // No subResource filter means we can only filter by DataSetWriterId in this else
        //     return {abortSending: true, payload: undefined};
        //
        // } else if (dataSetWriterIdFilter === 8) {
        //
        //     // Filtered by DataSetWriterId
        //     const actualPayload: IContainerConfig = (applicationResources as any)[subResource];
        //     payload.push({
        //         subResource: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
        //         Payload: actualPayload,
        //         DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
        //     });
        //     return {abortSending: false, payload: payload};
        //
        // }
        //
        // //FIXME is this needed? I do not fully understand how this method is supposed to behave
        // return {abortSending: true, payload: undefined};
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
