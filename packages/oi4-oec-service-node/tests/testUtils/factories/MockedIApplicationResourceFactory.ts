import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage,
    Oi4Identifier
} from '@oi4/oi4-oec-service-opcua-model';
import {
    Application,
    EDeviceHealth,
    Health,
    IContainerConfigConfigName,
    IContainerConfigValidation,
    IOI4ApplicationResources,
    IOI4Resource,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resources,
    RTLicense,
    SubscriptionList
} from '@oi4/oi4-oec-service-model';
import {extractProductInstanceUri} from '../../../src/application/OI4Resource';

export class MockedIApplicationResourceFactory {

    public static OI4_ID = Oi4Identifier.fromString('fakeManufacturerUri/fakeModel/fakeProductCode/fakeSerialNumber');

    public static getMockedIApplicationResourceInstance = (mam = MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel()): IOI4ApplicationResources => {
        return {
            sources: new Map<string, IOI4ApplicationResources>(),
            config: {
                'group_a': {
                    Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_a': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_b': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                'group_b': {
                    Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_ab': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_bb': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                'group_c': {
                    Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                    'config_ac': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    'config_bc': MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                },
                context: {Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeContext')},
                logging: {
                    auditLevel: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    logFileSize: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    logType: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                    Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName')
                },
                registry:
                    {
                        Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeName'),
                        description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
                        developmentMode: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig(),
                        showRegistry: MockedIApplicationResourceFactory.getMockedDefaultStandardIContainerConfig()
                    }
            },
            dataLookup: MockedIApplicationResourceFactory.getMockedDataLookup(),
            health: new Health(EDeviceHealth.NORMAL_0, 100),
            license: [new License('1', [{
                LicAuthors: ['John Doe', 'Mary Poppins', 'Bilbo Baggins', 'John Rambo', 'Homer Simpson'],
                Component: 'fakeComponent',
                LicAddText: 'fakeLicence'
            }])],
            licenseText: MockedIApplicationResourceFactory.getDefaultKeyValueItem(),
            mam: mam,
            metaDataLookup: MockedIApplicationResourceFactory.getMockedDefaultIContainerMetaData(),
            oi4Id: Oi4Identifier.fromString(extractProductInstanceUri(mam)),
            profile: new Profile(Application.mandatory), //,
            publicationList: MockedIApplicationResourceFactory.getMockedPublicationList(),
            rtLicense: new RTLicense(),
            subscriptionList: MockedIApplicationResourceFactory.getMockedSubscriptionList(),
            addDataSet(): void {
                return;
            },
            getLicense(): License[] {
                return this.license;
            },
            getPublicationList(oi4Id?: Oi4Identifier, resourceType?: Resources, tag?: string): PublicationList[] {
                return this.publicationList.filter((elem: PublicationList) => {
                    if (elem.Source.toString() !== oi4Id.toString()) return false;
                    if (resourceType !== undefined && elem.Resource !== resourceType) return false;
                    return !(tag !== undefined && elem.Filter !== tag);
                });
            },
            getSubscriptionList(): SubscriptionList[] {
                return this.subscriptionList;

            }, getHealth(): Health {
                return this.health;
            }, getMasterAssetModel(): MasterAssetModel {
                return this.mam;
            },
            getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource> {
                if (oi4Id !== undefined) {
                    return this.source.get(oi4Id.toString());
                }
                return this.source.values();
            },
            setConfig(): boolean {
                return true;
            },
            on(): IOI4ApplicationResources {
                return undefined;
            }
        };
    }

    private static getMockedDefaultStandardIContainerConfig(): IContainerConfigConfigName {
        return {
            Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeConfig'),
            DefaultValue: 'fakeValue',
            Mandatory: false,
            Validation: MockedIApplicationResourceFactory.getMockedDefaultIContainerConfigValidation(),
            Description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
            Value: 'fakeValue',
            Type: EOPCUABaseDataType.String
        };
    };

    private static getMockedDefaultIContainerConfigValidation(): IContainerConfigValidation {
        return {Length: 0, Min: 0, Max: 0, Pattern: 'fakePattern', Values: ['fakeValue']}
    }

    private static getDefaultKeyValueItem(): Map<string, LicenseText> {
        const licenseText = new Map<string, LicenseText>();
        licenseText.set('fakeKey', new LicenseText('fakeText'));
        return licenseText;
    }

    static getMockedDefaultMasterAssetModel(manufacturerUri = 'fakeManufacturerUri', modelText = '1', productCode = 'fakeProductCode', serialNumber = 'fakeSerialNumber'): MasterAssetModel {
        return MasterAssetModel.clone({
            ManufacturerUri: manufacturerUri,
            Model: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText(modelText),
            ProductCode: productCode,
            HardwareRevision: 'fakeHardwareRevision',
            SoftwareRevision: 'fakeSoftwareRevision',
            DeviceRevision: 'fakeDeviceRevision',
            DeviceManual: 'fakeDeviceManual',
            DeviceClass: 'OI4.OTConnector',
            SerialNumber: serialNumber,
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
                Filter: 'fakeFilter',
                Source: 'fakeSource',
                CorrelationId: '42',
                MetaData: {
                    Name: 'fakeName',
                    Description: this.getMockedIOPCUALocalizedText('fakeText'),
                    Fields: [],
                    DataSetClassId: 'fakeDatasetId',
                    ConfigurationVersion: {
                        MajorVersion: 12,
                        MinorVersion: 1,
                    },
                }
            }
        };
    }

    private static getMockedIOPCUALocalizedText(text: string): IOPCUALocalizedText {
        return {Locale: EOPCUALocale.enUS, Text: text};
    }

    private static getMockedPublicationList(): PublicationList[] {
        return [
            PublicationList.clone({
                Resource: Resources.HEALTH,
                DataSetWriterId: 42,
                Source: MockedIApplicationResourceFactory.OI4_ID,
            } as PublicationList),
            PublicationList.clone({
                Resource: Resources.EVENT,
                DataSetWriterId: 43,
                Filter: 'fakeFilter',
                Source: Oi4Identifier.fromString(`${MockedIApplicationResourceFactory.OI4_ID}_2`),
            } as PublicationList)
        ];
    }

    private static getMockedSubscriptionList(): SubscriptionList[] {
        return [
            SubscriptionList.clone({
                TopicPath: 'fakePath'
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
                    Source: 'fakeSource',
                    Payload: {
                        fakeContent: 'fakeContent',
                    }
                }],
            }
        }
    };

}