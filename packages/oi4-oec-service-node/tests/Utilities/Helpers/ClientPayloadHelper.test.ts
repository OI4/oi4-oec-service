import {ClientPayloadHelper} from '../../../src/Utilities/Helpers/ClientPayloadHelper';
import {ValidatedPayload} from '../../../src';
import {
    DataSetWriterIdManager,
    EDeviceHealth,
    Health,
    IOI4ApplicationResources,
    LicenseText,
    Resource,
    SubscriptionList,
    SyslogEvent,
} from '@oi4/oi4-oec-service-model';
import {MockedIApplicationResourceFactory} from '../../Test-utils/Factories/MockedIApplicationResourceFactory';
import {IOPCUADataSetMessage, EOPCUALocale, Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';

describe('Unit test for ClientPayloadHelper', () => {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const OI4_ID = MockedIApplicationResourceFactory.OI4_ID;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const OI4_ID_2 = Oi4Identifier.fromString(`${MockedIApplicationResourceFactory.OI4_ID}_2`);

    const default_payload = [{
        Source: OI4_ID.toString(),
        DataSetWriterId: 0,
        Payload: new Health(EDeviceHealth.NORMAL_0, 100)
    }];

    let clientPayloadHelper: ClientPayloadHelper;
    let mockedOI4ApplicationResources: IOI4ApplicationResources;

    beforeEach(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
        clientPayloadHelper = new ClientPayloadHelper();
        mockedOI4ApplicationResources = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance();
    });

    afterEach(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    });

    function checkAgainstDefaultPayload(payload: ValidatedPayload) {
        expect(payload.abortSending).toBe(false);
        expect(payload.payload).toStrictEqual(default_payload);
    }

    it('getDefaultHealthStatePayload works', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.getHealthPayload(mockedOI4ApplicationResources, OI4_ID);
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
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedOI4ApplicationResources, 'whatever');
        checkForUndefinedPayload(validatedPayload);
    });

    function createLicenseMockedPayload(dataSetWriterId: number, payload: any, oi4Id = OI4_ID) {
        return [{
            Source: oi4Id.toString(),
            DataSetWriterId: dataSetWriterId,
            Payload: payload
        }];
    };

    it('createLicenseTextSendResourcePayload works when containerState.licenseText[filter] is not undefined', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseTextSendResourcePayload(mockedOI4ApplicationResources, 'fakeKey');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload).toStrictEqual(createLicenseMockedPayload(0, new LicenseText('fakeText'), mockedOI4ApplicationResources.oi4Id));
    });

    it('createLicenseSendResourcePayload works', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createLicenseSendResourcePayload(mockedOI4ApplicationResources, OI4_ID_2.toString(), 'license');
        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
        expect(validatedPayload.payload[0].Source).toBe(OI4_ID_2.toString());
        expect(validatedPayload.payload[0].Filter).toBe('1');
    });

    function createPublicationMockedPayload(resource: string, datasetWriterId: number, oi4Id: Oi4Identifier) {
        return {
            DataSetWriterId: datasetWriterId,
            Source: oi4Id.toString(),
            Resource: resource,
            Filter: undefined as string
        } 
    }

    function createMockedPayloadWithSource(source: string, dataSetWriterId: number, payload: any, filter?: string) {
        return [{
            DataSetWriterId: dataSetWriterId,
            Source: source,
            Filter: filter,
            Payload: payload,
        }];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    function checkAgainstPublicationPayload(validatedPayload: ValidatedPayload, dataSetWriterId: number, resource = Resource.HEALTH, itemDataSetWriterId = 42, subOI4Id = OI4_ID, filter?: string, oi4Id = OI4_ID) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createPublicationMockedPayload(resource, itemDataSetWriterId, subOI4Id);
        if (filter !== undefined) {
            expectedInnerPayload.Filter = filter;
        }
        const expectedPayload = createMockedPayloadWithSource(oi4Id.toString(), dataSetWriterId, expectedInnerPayload, resource);
        expect(JSON.parse(JSON.stringify(validatedPayload.payload))).toStrictEqual(JSON.parse(JSON.stringify(expectedPayload)));
    }

    it('createPublicationListSendResourcePayload works when matching OI4 Id is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID);
        checkAgainstPublicationPayload(validatedPayload, 0, Resource.HEALTH, 42, OI4_ID, undefined, mockedOI4ApplicationResources.oi4Id);
    });

    it('createPublicationListSendResourcePayload works when matching resource is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID, Resource.HEALTH);
        checkAgainstPublicationPayload(validatedPayload, 0, Resource.HEALTH, 42, OI4_ID, undefined, mockedOI4ApplicationResources.oi4Id);
    });

    it('createPublicationListSendResourcePayload works when matching filter is supplied', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID_2, Resource.EVENT, 'fakeFilter');
        checkAgainstPublicationPayload(validatedPayload, 0, Resource.EVENT, 43, OI4_ID_2, 'fakeFilter', mockedOI4ApplicationResources.oi4Id);
    });

    it('createPublicationListSendResourcePayload return undefined payload when OI4 Id does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, Oi4Identifier.fromString(`not_there_${OI4_ID}_2`));
        checkForEmptyPayload(validatedPayload);
    });

    it('createPublicationListSendResourcePayload return undefined when resource does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID, Resource.LICENSE);
        checkForEmptyPayload(validatedPayload);
    });


    it('createPublicationListSendResourcePayload return undefined when filter does not match', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createPublicationListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID, Resource.HEALTH, '');
        checkForEmptyPayload(validatedPayload);
    });

    function createSubscriptionMockedPayload(topicPath: string) {
        return SubscriptionList.clone({
            topicPath: topicPath,
        } as SubscriptionList);
    }

    function checkAgainstSubscriptionPayload(validatedPayload: ValidatedPayload, topicPath: string, source: string) {
        expect(validatedPayload.abortSending).toBe(false);
        const expectedInnerPayload = createSubscriptionMockedPayload(topicPath);
        const expectedPayload = createMockedPayloadWithSource(source, 0, expectedInnerPayload, Resource.SUBSCRIPTION_LIST);
        expect(validatedPayload.payload).toStrictEqual(expectedPayload);
    }

    it('createSubscriptionListSendResourcePayload works when OI4 ID matches', async () => {
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createSubscriptionListSendResourcePayload(mockedOI4ApplicationResources, OI4_ID);
        checkAgainstSubscriptionPayload(validatedPayload, 'fakePath', mockedOI4ApplicationResources.oi4Id.toString());
    });

    function createConfigAppResource(): IOI4ApplicationResources {
        const applicationResources: IOI4ApplicationResources = {
            ...mockedOI4ApplicationResources,
            config: {'group1': {Name: {Text: 'group 1', Locale: EOPCUALocale.enUS}},
                    'context': {Name: {Text: 'filter1', Locale: EOPCUALocale.enUS}}}
        }

        const source = 'vendor.com/1/2/3';
        applicationResources.Source.clear();
        applicationResources.Source.set(source, {
            ...mockedOI4ApplicationResources,
            config: {'group2': {Name: {Text: 'group 2', Locale: EOPCUALocale.enUS}},
                    'context': {Name: {Text: 'filter2', Locale: EOPCUALocale.enUS}}}});

        return applicationResources;
    }

    it('createConfigSendResourcePayload works when filter is empty', async () => {
        const appResource = createConfigAppResource();
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(appResource);

        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(2);
        const payload1 = validatedPayload.payload[0];
        expect(payload1.Source).toStrictEqual(mockedOI4ApplicationResources.oi4Id.toString());
        expect(payload1.Filter).toBe('filter1');
        expect(payload1.Payload['group1'].Name.Text).toBe('group 1');
        const payload2 = validatedPayload.payload[1];
        expect(payload2.Source).toStrictEqual('vendor.com/1/2/3');
        expect(payload2.Filter).toBe('filter2');
        expect(payload2.Payload['group2'].Name.Text).toBe('group 2');
    });

    it('createConfigSendResourcePayload works when requesting main resource', async () => {
        const appResource = createConfigAppResource();
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(appResource, mockedOI4ApplicationResources.oi4Id);

        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
        const payload1 = validatedPayload.payload[0];
        expect(payload1.Source).toStrictEqual(mockedOI4ApplicationResources.oi4Id.toString());
        expect(payload1.Filter).toBe('filter1');
        expect(payload1.Payload['group1'].Name.Text).toBe('group 1');
    });

    it('createConfigSendResourcePayload works when requesting sub resource', async () => {
        const appResource = createConfigAppResource();
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(appResource, Oi4Identifier.fromString('vendor.com/1/2/3'));

        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
        const payload1 = validatedPayload.payload[0];
        expect(payload1.Source).toStrictEqual('vendor.com/1/2/3');
        expect(payload1.Filter).toBe('filter2');
        expect(payload1.Payload['group2'].Name.Text).toBe('group 2');
    });

    it('createConfigSendResourcePayload works when requesting main resource with filter', async () => {
        const appResource = createConfigAppResource();
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(appResource, mockedOI4ApplicationResources.oi4Id, 'filter1');

        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
        const payload1 = validatedPayload.payload[0];
        expect(payload1.Source).toStrictEqual(mockedOI4ApplicationResources.oi4Id.toString());
        expect(payload1.Filter).toBe('filter1');
        expect(payload1.Payload['group1'] .Name.Text).toBe('group 1');
    });

    it('createConfigSendResourcePayload returns nothing with unknown filter', async () => {
        const appResource = createConfigAppResource();
        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(appResource, mockedOI4ApplicationResources.oi4Id, 'unknown');

        expect(validatedPayload.abortSending).toBe(true);
        expect(validatedPayload.payload.length).toBe(0);
    });

    it('createConfigSendResourcePayload works when no context is available', async () => {
        const applicationResources: IOI4ApplicationResources = {
            ...mockedOI4ApplicationResources,
            config: {'group1': {Name: {Text: 'group 1', Locale: EOPCUALocale.enUS}}}
        }

        const validatedPayload: ValidatedPayload = clientPayloadHelper.createConfigSendResourcePayload(applicationResources);

        expect(validatedPayload.abortSending).toBe(false);
        expect(validatedPayload.payload.length).toBe(1);
        const payload1 = validatedPayload.payload[0];
        expect(payload1.Source).toStrictEqual(mockedOI4ApplicationResources.oi4Id.toString());
        expect(payload1.Filter).toBe(undefined);
        expect(payload1.Payload['group1'].Name.Text).toBe('group 1');
    });

    it('createPublishEventMessage works', async () => {
        const event = new SyslogEvent('fakeOrigin', 0, 'fakeDescription');
        event.details = {
            MSG: 'fakeMSG',
            HEADER: 'fakeHeader',
        };
        const message: IOPCUADataSetMessage[] = clientPayloadHelper.createPublishEventMessage('fakeFilter', 'fakeSource', event);
        expect(message.length).toBe(1);
        const extractedMessage = message[0];
        expect(extractedMessage.DataSetWriterId).toBe(0);
        expect(extractedMessage.Filter).toBe('fakeFilter');
        expect(extractedMessage.Source).toBe('fakeSource');
        expect(extractedMessage.Payload).toStrictEqual(event);
    });

});
