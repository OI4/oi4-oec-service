import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage, Oi4Identifier
} from '@oi4/oi4-oec-service-opcua-model';
import {
    Application,
    EDeviceHealth,
    Health,
    IContainerConfigConfigName,
    IOI4ApplicationResources, IOI4Resource,
    License,
    LicenseText,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resource,
    RTLicense, SubscriptionList
} from '@oi4/oi4-oec-service-model';
import {extractProductInstanceUri} from '../../../src/application/OI4Resource';

export class MockedIApplicationResourceFactory {

    public static OI4_ID = Oi4Identifier.fromString('fakeManufacturerUri/fakeModel/fakeProductCode/fakeSerialNumber');

    public static getMockedIApplicationResourceInstance = (mam = MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel()): IOI4ApplicationResources => {
        return {
            Source: new Map<string, IOI4ApplicationResources>(),
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

            // eslint-disable-next-line @typescript-eslint/naming-convention
            addDataSet(_: string, __: IOPCUANetworkMessage, ___: IOPCUAMetaData): void {
                console.log('Called mocked addDataSet. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            getLicense(oi4Id: Oi4Identifier, licenseId?: string): License[] {
                console.log(`Called mocked addLicenseText with params ${oi4Id} and ${licenseId}. Do nothing....`);
                return this.license;
            },
            getPublicationList(oi4Id?: Oi4Identifier, resourceType?: Resource, tag?: string): PublicationList[] {
                console.log(`Called mocked getPublicationList with params ${oi4Id}, ${resourceType} and ${tag}.`);
                return this.publicationList.filter((elem: PublicationList) => {
                    if (elem.Source.toString() !== oi4Id.toString()) return false;
                    if (resourceType !== undefined && elem.Resource !== resourceType) return false;
                    if (tag !== undefined && elem.Filter !== tag) return false;
                    return true;
                });
            },
            getSubscriptionList(oi4Id?: Oi4Identifier, resourceType?: Resource, tag?: string): SubscriptionList[] {
                console.log(`Called mocked getSubscriptionList with params ${oi4Id}, ${resourceType} and ${tag}.`);
                return this.subscriptionList;
            }, getHealth(oi4Id: Oi4Identifier): Health {
                console.log(`Called mocked getHealth with params ${oi4Id}`);
                return this.health;
            }, getMasterAssetModel(oi4Id: Oi4Identifier): MasterAssetModel {
                console.log(`Called mocked getMasterAssetModel with params ${oi4Id}`);
                return this.mam;
            },
            getSource(oi4Id?: Oi4Identifier): IOI4Resource | IterableIterator<IOI4Resource> {
                console.log(`Called mocked getSource with params ${oi4Id}`);
                if(oi4Id !== undefined) {
                    return this.source.get(oi4Id.toString());
                }
                return this.source.values();
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
            Name: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeConfig'),
            DefaultValue: 'fakeValue',
            Mandatory: false,
            Validation: MockedIApplicationResourceFactory.getMockedDefaultIContainerConfigValidation(),
            Description: MockedIApplicationResourceFactory.getMockedIOPCUALocalizedText('fakeDescription'),
            Value: 'fakeValue',
            Type: EOPCUABaseDataType.String
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
                Resource: Resource.HEALTH,
                DataSetWriterId: 42,
                Source: MockedIApplicationResourceFactory.OI4_ID,
            } as PublicationList),
            PublicationList.clone({
                Resource: Resource.EVENT,
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
