import {ValidatedPayload} from './Types';
import {
    CDataSetWriterIdLookup,
    EDeviceHealth,
    ESyslogEventFilter,
    IContainerHealth, IContainerState, ILicenseObject,
    IPublicationListObject,
    ISpecificContainerConfig,
    ISubscriptionListObject
} from '@oi4/oi4-oec-service-model';
import {IOPCUAPayload} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {ResourceType} from './Enums';
//FIXME The code of some methods here is pretty similar. Is not possible to refactor it somehow?
export class ClientPayloadHelper {

    private componentLogger: Logger;

    constructor(logger: Logger) {
        this.componentLogger = logger;
    }

    static createHealthStatePayload(health: EDeviceHealth, score: number): IContainerHealth {
        return {health: health, healthScore: score};
    }

    private createPayload(payload: any, dswid: number): IOPCUAPayload {
        return {
            payload: payload,
            dswid: dswid,
        };
    };

    getDefaultHealthStatePayload(): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];
        const healthState: IContainerHealth = ClientPayloadHelper.createHealthStatePayload(EDeviceHealth.NORMAL_0, 100);
        payload.push(this.createPayload(healthState, CDataSetWriterIdLookup[ResourceType.HEALTH]));
        return {abortSending: false, payload: payload};
    }

    createDefaultSendResourcePayload(oi4Id: string, containerState: IContainerState, resource: string, filter: string, dswidFilter: number): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];

        if (filter === oi4Id) {
            payload.push(this.createPayload((containerState as any)[resource], CDataSetWriterIdLookup[resource]));
        } else if (Number.isNaN(dswidFilter)) {
            // If the filter is not an oi4Id and not a number, we don't know how to handle it
            return {abortSending: true, payload: undefined};
        } else if (resource === Object.keys(CDataSetWriterIdLookup)[dswidFilter - 1]) { // Fallback to DSWID based resource
            payload.push(this.createPayload((containerState as any)[resource], CDataSetWriterIdLookup[resource]));
            // FIXME I guess that this return is wrong ain't it? Because it makes no sense at all, since the payload won't be used
            //return;
        }

        return {abortSending: false, payload: payload};
    }

    createLicenseTextSendResourcePayload(containerState: IContainerState, filter: string, resource: string): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];
        // FIXME: Hotfix
        if (typeof containerState.licenseText[filter] === 'undefined') {
            return {abortSending: true, payload: undefined};
        }
        // licenseText is special...
        payload.push(this.createPayload({licenseText: containerState.licenseText[filter]}, CDataSetWriterIdLookup[resource]));
        return {abortSending: false, payload: payload};
    }

    createLicenseSendResourcePayload(containerState: IContainerState, filter: string, dswidFilter: number, resource: string): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];

        if (Number.isNaN(dswidFilter)) { // Try to filter with licenseId
            if (containerState['license'].licenses.some((elem: ILicenseObject) => elem.licenseId === filter)) { // Does it even make sense to filter?
                const filteredLicenseArr = containerState['license'].licenses.filter((elem: ILicenseObject) => {
                    if (elem.licenseId === filter) return elem;
                });

                for (const filteredLicense of filteredLicenseArr) {
                    payload.push({
                        poi: filteredLicense.licenseId,
                        payload: { components: filteredLicense.components },
                        dswid: CDataSetWriterIdLookup['license'],
                    });
                }

                return {abortSending: false, payload: payload};
            }
        } else if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
            return this.manageInvalidDSWIDFilter(resource);
        }

        for (const license of containerState['license'].licenses) {
            payload.push({
                poi: license.licenseId,
                payload: { components: license.components },
                dswid: CDataSetWriterIdLookup[resource],
            })
        }

        return {abortSending: false, payload: payload};
    }

    createPublicationListSendResourcePayload(containerState: IContainerState, filter: string, dswidFilter: number, resource: string): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];

        if (Number.isNaN(dswidFilter)) { // Try to filter with resource
            if (containerState['publicationList'].publicationList.some((elem: IPublicationListObject) => elem.resource === filter)) { // Does it even make sense to filter?
                const filteredPubsArr = containerState['publicationList'].publicationList.filter((elem: IPublicationListObject) => {
                    if (elem.resource === filter) return elem;
                });
                for (const filteredPubs of filteredPubsArr) {
                    payload.push({
                        poi: filteredPubs.resource,
                        payload: filteredPubs,
                        dswid: CDataSetWriterIdLookup[resource],
                    });
                }
                // FIXME According to what I've read, the break is not allowed into if statements. This will raise and error. Maybe better to double check it.
                //break;
                return {abortSending: false, payload: payload};
            }
        } else if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
            return this.manageInvalidDSWIDFilter(resource);
        }

        for (const pubs of containerState['publicationList'].publicationList) {
            payload.push({
                poi: pubs.resource,
                payload: pubs,
                dswid: CDataSetWriterIdLookup[resource],
            })
        }
        return {abortSending: false, payload: payload};
    }

    createSubscriptionListSendResourcePayload(containerState: IContainerState, filter: string, dswidFilter: number, resource: string): ValidatedPayload {
        const payload: IOPCUAPayload[] = [];

        if (Number.isNaN(dswidFilter)) { // Try to filter with resource
            // 7 is resource
            if (containerState['subscriptionList'].subscriptionList.some((elem: ISubscriptionListObject) => elem.topicPath.split('/')[7] === filter)) { // Does it even make sense to filter?
                const filteredSubsArr = containerState['subscriptionList'].subscriptionList.filter((elem: ISubscriptionListObject) => {
                    if (elem.topicPath.split('/')[7] === filter) return elem;
                });
                for (const filteredSubs of filteredSubsArr) {
                    payload.push({
                        poi: filteredSubs.topicPath.split('/')[7],
                        payload: filteredSubs,
                        dswid: CDataSetWriterIdLookup[resource],
                    });
                }
                // FIXME According to what I've read, the break is not allowed into if statements. This will raise and error. Maybe better to double check it.
                //break;
                return {abortSending: false, payload: payload};
            }
        } else if (dswidFilter !== CDataSetWriterIdLookup[resource]) {
            return this.manageInvalidDSWIDFilter(resource);
        }

        for (const subs of containerState['subscriptionList'].subscriptionList) {
            payload.push({ // TODO: poi out of topicPath property
                poi: subs.topicPath.split('/')[7],
                payload: subs,
                dswid: CDataSetWriterIdLookup[resource],
            })
        }

        return {abortSending: false, payload: payload};
    }

    private manageInvalidDSWIDFilter(resource: string): ValidatedPayload {
        // We don't need to fill the payloads in the "else" case. Since there's only one DSWID in the license Resource, we send all licenses
        // Whether there's a DSWID filter, or not we always send all licenses
        // We only need a check here, if the DSWID even fits. If not, we just abort sending
        this.componentLogger.log(`DSWID does not fit to ${resource} Resource`, ESyslogEventFilter.warning);
        return {abortSending: true, payload: undefined};
    }

    createConfigSendResourcePayload(containerState: IContainerState, filter: string, dswidFilter: number, resource: string): ValidatedPayload {
        const actualPayload: ISpecificContainerConfig = (containerState as any)[resource];
        const payload: IOPCUAPayload[] = [];

        // Send all configs out
        if (filter === '') {

            payload.push({
                poi: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                payload: actualPayload,
                dswid: CDataSetWriterIdLookup[resource]
            });
            return {abortSending: false, payload: payload};

        // Send only filtered config out
        } else if (filter === actualPayload.context.name.text.toLowerCase().replace(' ', '')) {

            // Filtered by poi
            actualPayload[filter] = containerState['config'][filter];
            payload.push({
                poi: filter,
                payload: actualPayload,
                dswid: CDataSetWriterIdLookup[resource]
            });
            return {abortSending: false, payload: payload};

        } else if (Number.isNaN(dswidFilter)) {

            // No poi filter means we can only filter by dswid in this else
            return {abortSending: true, payload: undefined};

        } else if (dswidFilter === 8) {

            // Filtered by dswid
            const actualPayload: ISpecificContainerConfig = (containerState as any)[resource];
            payload.push({
                poi: actualPayload.context.name.text.toLowerCase().replace(' ', ''),
                payload: actualPayload,
                dswid: CDataSetWriterIdLookup[resource]
            });
            return {abortSending: false, payload: payload};

        }

        //FIXME is this needed? I do not fully understand how this method is supposed to behave
        return {abortSending: true, payload: undefined};
    }

}