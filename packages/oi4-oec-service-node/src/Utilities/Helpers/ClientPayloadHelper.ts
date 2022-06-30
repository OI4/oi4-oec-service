import {ValidatedPayload} from './Types';
import {
    DataSetWriterIdManager,
    EDeviceHealth,
    ESyslogEventFilter,
    Health,
    IContainerConfig,
    IEvent,
    IOI4ApplicationResources,
    IPublicationListObject,
    ISubscriptionListObject,
    License,
    LicenseText,
    OI4Payload,
    Resource,
} from '@oi4/oi4-oec-service-model';
import {IOPCUADataSetMessage} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';

export class ClientPayloadHelper {

    private createPayload(payload: OI4Payload, subResource: string): IOPCUADataSetMessage {
        return {
            DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(payload.resourceType(), subResource),
            subResource: subResource,
            Payload: payload,
        };
    };


    getDefaultHealthStatePayload(oi4Id: string): ValidatedPayload {
        const healthState: Health = this.createHealthStatePayload(EDeviceHealth.NORMAL_0, 100);
        const payload: IOPCUADataSetMessage[] = [this.createPayload(healthState, oi4Id)];
        return {abortSending: false, payload: payload};
    }

    createMamResourcePayload(applicationResources: IOI4ApplicationResources, subResource: string): ValidatedPayload {
        const payload = [this.createPayload(applicationResources.mam, subResource)];
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
        // FIXME: Hotfix
        if (typeof applicationResources.licenseText[filter] === 'undefined') {
            return {abortSending: true, payload: undefined};
        }
        // licenseText is special...
        const licenseText = new LicenseText(applicationResources.licenseText[filter]);
        payload.push(this.createPayload(licenseText, applicationResources.oi4Id));
        return {abortSending: false, payload: payload};
    }

    // TODO Rework
    createLicenseSendResourcePayload(applicationResources: IOI4ApplicationResources, subResource?: string, licenseId?: string): ValidatedPayload {
        const payload: IOPCUADataSetMessage[] = [];
        const licenses: License[] = applicationResources.getLicense(subResource, licenseId);

        for (const license of licenses) {
            payload.push({
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(license.resourceType(), subResource),
                filter: licenseId,
                subResource: license.licenseId,
                Timestamp: new Date().toISOString(),
                Payload: {components: license.components},
            })
        }

        return {abortSending: false, payload: payload};
    }

    createPublicationListSendResourcePayload(applicationResources: IOI4ApplicationResources, filter: string, dataSetWriterIdFilter: number, resource: string): ValidatedPayload {
        const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(Resource.PUBLICATION_LIST, applicationResources.oi4Id);
        const payload: IOPCUADataSetMessage[] = [];

        if (Number.isNaN(dataSetWriterIdFilter)) { // Try to filter with resource
            if (applicationResources.publicationList.some((elem: IPublicationListObject) => elem.resource === filter)) { // Does it even make sense to filter?
                const filteredPubsArr = applicationResources.publicationList.filter((elem: IPublicationListObject) => {
                    if (elem.resource === filter) return elem;
                });
                for (const filteredPubs of filteredPubsArr) {
                    payload.push({
                        subResource: filteredPubs.resource,
                        Payload: filteredPubs,
                        DataSetWriterId: dataSetWriterId,
                    });
                }
                // FIXME According to what I've read, the break is not allowed into if statements. This will raise and error. Maybe better to double check it.
                //break;
                return {abortSending: false, payload: payload};
            }
        } else if (dataSetWriterIdFilter !== dataSetWriterId) {
            return this.manageInvaliddataSetWriterIdFilter(resource);
        }

        for (const pubs of applicationResources.publicationList) {
            payload.push({
                subResource: pubs.resource,
                Payload: pubs,
                DataSetWriterId: dataSetWriterId,
            })
        }
        return {abortSending: false, payload: payload};
    }

    createSubscriptionListSendResourcePayload(applicationResources: IOI4ApplicationResources, filter: string, dataSetWriterIdFilter: number, resource: string): ValidatedPayload {
        const dataSetWriterId = DataSetWriterIdManager.getDataSetWriterId(Resource.SUBSCRIPTION_LIST, applicationResources.oi4Id);
        const payload: IOPCUADataSetMessage[] = [];

        if (Number.isNaN(dataSetWriterIdFilter)) { // Try to filter with resource
            // 7 is resource
            if (applicationResources.subscriptionList.some((elem: ISubscriptionListObject) => elem.topicPath.split('/')[7] === filter)) { // Does it even make sense to filter?
                const filteredSubsArr = applicationResources.subscriptionList.filter((elem: ISubscriptionListObject) => {
                    if (elem.topicPath.split('/')[7] === filter) return elem;
                });
                for (const filteredSubs of filteredSubsArr) {
                    payload.push({
                        subResource: filteredSubs.topicPath.split('/')[7],
                        Payload: filteredSubs,
                        DataSetWriterId: dataSetWriterId,
                    });
                }
                // FIXME According to what I've read, the break is not allowed into if statements. This will raise and error. Maybe better to double check it.
                //break;
                return {abortSending: false, payload: payload};
            }
        } else if (dataSetWriterIdFilter !== dataSetWriterId) {
            return this.manageInvaliddataSetWriterIdFilter(resource);
        }

        for (const subs of applicationResources.subscriptionList) {
            payload.push({ // TODO: subResource out of topicPath property
                subResource: subs.topicPath.split('/')[7],
                Payload: subs,
                DataSetWriterId: dataSetWriterId,
            })
        }

        return {abortSending: false, payload: payload};
    }

    private manageInvaliddataSetWriterIdFilter(resource: string): ValidatedPayload {
        // We don't need to fill the Payloads in the "else" case. Since there's only one DataSetWriterId in the license Resource, we send all licenses
        // Whether there's a DataSetWriterId filter, or not we always send all licenses
        // We only need a check here, if the DataSetWriterId even fits. If not, we just abort sending
        LOGGER.log(`DataSetWriterId does not fit to ${resource} Resource`, ESyslogEventFilter.warning);
        return {abortSending: true, payload: undefined};
    }

    // TODO this method must be refactored
    createConfigSendResourcePayload(applicationResources: IOI4ApplicationResources, filter: string, dataSetWriterIdFilter: number, subResource: string): ValidatedPayload {
        const actualPayload: IContainerConfig = (applicationResources as any)[subResource];
        const payload: IOPCUADataSetMessage[] = [];

        // Send all configs out
        if (filter === '') {

            payload.push({
                subResource: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                Payload: actualPayload,
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
            });
            return {abortSending: false, payload: payload};

            // Send only filtered config out
        } else if (filter === actualPayload.context.name.text.toLowerCase().replace(' ', '')) {

            // Filtered by subResource
            actualPayload[filter] = applicationResources['config'][filter];
            payload.push({
                subResource: filter,
                Payload: actualPayload,
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
            });
            return {abortSending: false, payload: payload};

        } else if (Number.isNaN(dataSetWriterIdFilter)) {

            // No subResource filter means we can only filter by DataSetWriterId in this else
            return {abortSending: true, payload: undefined};

        } else if (dataSetWriterIdFilter === 8) {

            // Filtered by DataSetWriterId
            const actualPayload: IContainerConfig = (applicationResources as any)[subResource];
            payload.push({
                subResource: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                Payload: actualPayload,
                DataSetWriterId: DataSetWriterIdManager.getDataSetWriterId(Resource.CONFIG, subResource),
            });
            return {abortSending: false, payload: payload};

        }

        //FIXME is this needed? I do not fully understand how this method is supposed to behave
        return {abortSending: true, payload: undefined};
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
