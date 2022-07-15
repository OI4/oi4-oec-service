import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {ValidatedPayload} from '../../../src/Utilities/Helpers/Types';
import {
    DataSetWriterIdManager,
    EDeviceHealth,
    Health,
    IOI4ApplicationResources,
    LicenseText,
    PublicationList,
    Resource,
    SubscriptionList,
    SyslogEvent,
} from '@oi4/oi4-oec-service-model';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {IOPCUADataSetMessage} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for ClientPayloadHelper', () => {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const OI4_ID = MockedIApplicationResourceFactory.OI4_ID;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const OI4_ID_2 = `${MockedIApplicationResourceFactory.OI4_ID}_2`;

    const default_payload = [{
        subResource: OI4_ID,
        DataSetWriterId: 0,
        Payload: new Health(EDeviceHealth.NORMAL_0, 100)
    }];

    let clientPayloadHelper: ClientPayloadHelper;
    let mockedIContainerState: IOI4ApplicationResources;

    beforeEach(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
        clientPayloadHelper = new ClientPayloadHelper();
        mockedIContainerState = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
    });

    afterEach(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    });

    function checkAgainstDefaultPayload(payload: ValidatedPayload) {
        expect(payload.abortSending).toBe(false);
        expect(payload.payload).toStrictEqual(default_payload);
    }

    it('getDefaultHealthStatePayload works', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.getDefaultHealthStatePayload(mockedIContainerState.oi4Id);
        checkAgainstDefaultPayload(validatedPayload);
    });

    it('createHealthStatePayload works', async () => {
        const statePayload: Health = clientPayloadHelper.createHealthStatePayload(EDeviceHealth.FAILURE_1, 0);
        expect(statePayload.health).toBe(EDeviceHealth.FAILURE_1);
        expect(statePayload.healthScore).toBe(0);
    });

    function checkForUndefinedPayload(validatedPayload: ValidatedPayload) {
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBe(undefined);
    }

    function checkForEmptyPayload(validatedPayload: ValidatedPayload) {
        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload).toBeDefined()
        expect(validatedPayload.payload.length).toBe(0);
    }

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'whatever');
        checkForUndefinedPayload(validatedPayload);
    });

    function createLicenseMockedPayload(dataSetWriterId: number, payload: any) {
        return [{
            subResource: OI4_ID,
            DataSetWriterId: dataSetWriterId,
            Payload: payload
        }];
    };

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is not undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedIContainerState, 'fakeKey');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual(createLicenseMockedPayload(0, new LicenseText('fakeText')));
    });

    it('createLicenseSendResourcePayload works', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedIContainerState, '2', 'license');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
    });

    function createPublicationMockedPayload(resource: string, datasetWriterId: number, oi4Id: string) {
        return PublicationList.clone({
            DataSetWriterId: datasetWriterId,
            oi4Identifier: oi4Id,
            resource: resource,
        } as PublicationList);
    }

    function createMockedPayloadWithSubresource(subResource: string, dataSetWriterId: number, payload: any, filter?: string) {
        return [{
            DataSetWriterId: dataSetWriterId,
            subResource: subResource,
            filter: filter,
            Payload: payload,
        }];
    }

    function checkAgainstPublicationPayload(validatedPayload: ValidatedPayload, dataSetWriterId: number, resource = Resource.HEALTH, itemDataSetWriterId = 42, subOI4Id = OI4_ID, filter?: string) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload(resource, itemDataSetWriterId, subOI4Id);
        if (filter !== undefined) {
            expectedInnerPayload.filter = filter;
        }
        const expectedPayload = createMockedPayloadWithSubresource(OI4_ID, dataSetWriterId, expectedInnerPayload, resource);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createPublicationListSendResourcePayload works when matching OI4 Id is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, OI4_ID);
        checkAgainstPublicationPayload(validatedPayload, 0);
    });

    it('createPublicationListSendResourcePayload works when matching resource is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, OI4_ID, Resource.HEALTH);
        checkAgainstPublicationPayload(validatedPayload, 0);
    });

    it('createPublicationListSendResourcePayload works when matching filter is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, OI4_ID_2, Resource.EVENT, 'fakeFilter');
        checkAgainstPublicationPayload(validatedPayload, 0, Resource.EVENT, 43, OI4_ID_2, 'fakeFilter');
    });

    it('createPublicationListSendResourcePayload return undefined payload when OI4 Id does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, `not_there_${OI4_ID}`);
        checkForEmptyPayload(validatedPayload);
    });

    it('createPublicationListSendResourcePayload return undefined when resource does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, OI4_ID, Resource.LICENSE);
        checkForEmptyPayload(validatedPayload);
    });


    it('createPublicationListSendResourcePayload return undefined when filter does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedIContainerState, OI4_ID, Resource.HEALTH, '');
        checkForEmptyPayload(validatedPayload);
    });

    function createSubscriptionMockedPayload(topicPath: string) {
        return SubscriptionList.clone({
            topicPath: topicPath,
        } as SubscriptionList);
    }

    function checkAgainstSubscriptionPayload(validatedPayload: ValidatedPayload, topicPath: string, subresource: string) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createSubscriptionMockedPayload(topicPath);
        const expectedPayload = createMockedPayloadWithSubresource(subresource, 0, expectedInnerPayload, Resource.SUBSCRIPTION_LIST);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createSubscriptionListSendResourcePayload works when OI4 ID matches', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createSubscriptionListSendResourcePayload(mockedIContainerState, 'oi4Id');
        checkAgainstSubscriptionPayload(validatedPayload, 'fakePath', OI4_ID);
    });

    // function checkAgainstConfigPayload(validatedPayload: ValidatedPayload) {
    //     expect(validatedPayload.abortSending).toBe(false);
    //     const receivedPayload = validatedPayload.payload[0];
    //     expect(receivedPayload.subResource).toStrictEqual('fakecontext');
    //     expect(receivedPayload.DataSetWriterId).toStrictEqual(8);
    //     expect(receivedPayload.Payload).not.toBe(null);
    //
    //     expect(receivedPayload.Payload.context.name).not.toBe(null);
    //
    //     expect(receivedPayload.Payload.logging.auditLevel).not.toBe(null);
    //     expect(receivedPayload.Payload.logging.logFileSize).not.toBe(null);
    //     expect(receivedPayload.Payload.logging.logType).not.toBe(null);
    //     expect(receivedPayload.Payload.logging.name).not.toBe(null);
    //
    //     expect(receivedPayload.Payload.registry.name).not.toBe(null);
    //     expect(receivedPayload.Payload.registry.description).not.toBe(null);
    //     expect(receivedPayload.Payload.registry.developmentMode).not.toBe(null);
    //     expect(receivedPayload.Payload.registry.showRegistry).not.toBe(null);
    // }

    // it('createConfigSendResourcePayload works when filter is empty ', async () => {
    //     const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, '', NaN, 'fakeOi4Id');
    //     checkAgainstConfigPayload(validatedPayload);
    // });
    //
    // it('createConfigSendResourcePayload works when filter is equal to Payload.context.name', async () => {
    //     const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'fakecontext', 42, 'fakeOi4Id');
    //     checkAgainstConfigPayload(validatedPayload);
    // });
    //
    // it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is NaN', async () => {
    //     const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', NaN, 'config');
    //     checkForUndefinedPayload(validatedPayload);
    // });
    //
    // it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is 8', async () => {
    //     const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', 8, 'config');
    //     checkAgainstConfigPayload(validatedPayload);
    // });
    //
    // it('createConfigSendResourcePayload works when filter is not equal to Payload.context.name and datasetWriterId is invalid', async () => {
    //     const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(mockedIContainerState, 'whatever', 9, 'config');
    //     checkForUndefinedPayload(validatedPayload);
    // });

    it('createPublishEventMessage works', async () => {
        const event = new SyslogEvent('fakeOrigin', 0, 'fakeDescription');
        event.details = {
            MSG: 'fakeMSG',
            HEADER: 'fakeHeader',
        };
        const message: IOPCUADataSetMessage[] = clientPayloadHelper.createPublishEventMessage('fakeFilter', 'fakeSubResource', event);
        expect(message.length).toBe(1);
        const extractedMessage = message[0];
        expect(extractedMessage.DataSetWriterId).toBe(0);
        expect(extractedMessage.filter).toBe('fakeFilter');
        expect(extractedMessage.subResource).toBe('fakeSubResource');
        expect(extractedMessage.Payload).toStrictEqual(event);
    });

});
