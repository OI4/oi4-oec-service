import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {
    Application,
    EDeviceHealth,
    Health,
    IContainerConfigConfigName,
    IOI4ApplicationResources,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resource,
    RTLicense, SubscriptionList
} from '@oi4/oi4-oec-service-model';

export class MockedIApplicationResourceFactory {

    public static OI4_ID = 'fakeOi4Id';

    public static getMockedIApplicationResourceInstance = (): IOI4ApplicationResources => {
        return {
            subResources: new Map<string, IOI4ApplicationResources>(),
            config: {
                'group_a': {
                    name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_a': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_b': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                'group_b': {
                    name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_ab': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_bb': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                'group_c': {
                    name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_ac': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_bc': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                context: {name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeContext')},
                logging: {
                    auditLevel: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    logFileSize: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    logType: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName')
                },
                registry:
                    {
                        name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                        description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
                        developmentMode: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                        showRegistry: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                    }
            },
            dataLookup: MockedIApplicationResourceFactory.getMockedDataLookup(),
            health: new Health(EDeviceHealth.NORMAL_0, 100),
            license: [new License('1', [{
                licAuthors: ['John Doe', 'Mary Poppins', 'Bilbo Baggins', 'John Rambo', 'Homer Simpson'],
                component: 'fakeComponent',
                licAddText: 'fakeLicence'
            }])],
            licenseText: MockedIApplicationResourceFactory.getDefaultKeyValueItem(),
            mam: MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel(),
            metaDataLookup: MockedIApplicationResourceFactory.getMockedDefaultIContainerMetaData(),
            oi4Id: this.OI4_ID,
            profile: new Profile(Application.mandatory), //,
            publicationList: MockedIApplicationResourceFactory.getMockedPublicationList(),
            rtLicense: new RTLicense(),
            subscriptionList: MockedIApplicationResourceFactory.getMockedSubscriptionList(),

            // eslint-disable-next-line @typescript-eslint/naming-convention
            addDataSet(_: string, __: IOPCUANetworkMessage, ___: IOPCUAMetaData): void {
                console.log('Called mocked addDataSet. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            getLicense(oi4Id: string, licenseId?: string): License[] {
                console.log(`Called mocked addLicenseText with params ${oi4Id} and ${licenseId}. Do nothing....`);
                return this.license;
            },
            getPublicationList(oi4Id?: string, resourceType?: Resource, tag?: string): PublicationList[] {
                console.log(`Called mocked getPublicationList with params ${oi4Id}, ${resourceType} and ${tag}.`);
                return this.publicationList.filter((elem: PublicationList) => {
                    if (elem.oi4Identifier !== oi4Id) return false;
                    if (resourceType !== undefined && elem.resource !== resourceType) return false;
                    if (tag !== undefined && elem.filter !== tag) return false;
                    return true;
                });
            },
            getSubscriptionList(oi4Id?: string, resourceType?: Resource, tag?: string): SubscriptionList[] {
                console.log(`Called mocked getSubscriptionList with params ${oi4Id}, ${resourceType} and ${tag}.`);
                return this.subscriptionList;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            setHealth(_: EDeviceHealth): void {
                console.log('Called mocked setHealth. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            setHealthState(_: number): void {
                console.log('Called mocked setHealthState. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            on(_: string, __: Function): IOI4ApplicationResources {
                console.log('Called mocked on. Do nothing....');
                return undefined;
            }
        };
    }

    private static getMockedDefaultStandardIContainerConfig(): IContainerConfigConfigName {
        return {
            name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeConfig'),
            defaultValue: 'fakeValue',
            mandatory: false,
            validation: MockedIApplicationResourceFactory.getMockedDefaultIContainerConfigValidation(),
            description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
            value: 'fakeValue',
            type: EOPCUABaseDataType.String
        };
    };

    private static getMockedDefaultIContainerConfigValidation() {
        return {length: 0, min: 0, max: 0, pattern: 'fakePattern', values: ['fakeValue']}
    }

    private static getDefaultKeyValueItem() {
        const licenseText = new Map<string, LicenseText>();
        licenseText.set('fakeKey', new LicenseText('fakeText'));
        return licenseText;
    }

    private static getMockedDefaultMasterAssetModel(): MasterAssetModel {
        return MasterAssetModel.clone({
            ManufacturerUri: 'fakeManufacturerUri',
            Model: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeModel'),
            ProductCode: 'fakeProductCode',
            HardwareRevision: 'fakeHardwareRevision',
            SoftwareRevision: 'fakeSoftwareRevision',
            DeviceRevision: 'fakeDeviceRevision',
            DeviceManual: 'fakeDeviceManual',
            DeviceClass: 'fakeDeviceClass',
            SerialNumber: 'fakeSerialNumber',
            ProductInstanceUri: 'fakeProductInstanceURI',
            RevisionCounter: -1,
            Description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
            Manufacturer: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeManufacturer')
        } as MasterAssetModel);
    };

    private static getMockedDefaultIContainerMetaData(): Record<string, IOPCUAMetaData> {
        return {
            'tag-01': {
                MessageId: 'fakeMessageId', // TODO: Not yet defined <unixTimestampInMs-PublisherId>
                MessageType: EOPCUAMessageType.uaData,
                PublisherId: 'fakePublisherId',
                DataSetWriterId: 42,
                filter: 'fakeFilter',
                subResource: 'fakeSubResource',
                correlationId: '42',
                MetaData: {
                    name: 'fakeName',
                    description: this.getMockedIOPCUALocalizedText('fakeText'),
                    fields: [],
                    dataSetClassId: 'fakeDatasetId',
                    configurationVersion: {
                        majorVersion: 12,
                        minorVersion: 1,
                    },
                }
            }
        };
    }

    private static getMockedIOPCUALocalizedText(text: string): IOPCUALocalizedText {
        return {locale: EOPCUALocale.enUS, text: text};
    }

    private static getMockedPublicationList(): PublicationList[] {
        return [
            PublicationList.clone({
                resource: Resource.HEALTH,
                DataSetWriterId: 42,
                oi4Identifier: MockedIApplicationResourceFactory.OI4_ID,
            } as PublicationList),
            PublicationList.clone({
                resource: Resource.EVENT,
                DataSetWriterId: 43,
                filter: 'fakeFilter',
                oi4Identifier: MockedIApplicationResourceFactory.OI4_ID + '_2',
            } as PublicationList)
        ];
    }

    private static getMockedSubscriptionList(): SubscriptionList[] {
        return [
            SubscriptionList.clone({
                topicPath: 'fakePath'
            } as SubscriptionList)
        ];
    }

    private static getMockedDataLookup(): Record<string, IOPCUANetworkMessage> {
        return {
            'fakeKey': {
                MessageId: 'fakeMessageId',
                MessageType: EOPCUAMessageType.uaData,
                PublisherId: 'fakePublisherId',
                DataSetClassId: 'fakeDataSetId',
                Messages: [{
                    DataSetWriterId: 42,
                    subResource: 'fakeSubResource',
                    Payload: {
                        fakeContent: 'fakeContent',
                    }
                }],
            }
        }
    };

}
