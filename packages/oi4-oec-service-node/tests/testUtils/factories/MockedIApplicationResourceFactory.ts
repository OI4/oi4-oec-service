import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage,
    Oi4Identifier,
    EDeviceHealth,
    Health,
    IContainerConfigConfigName,
    IContainerConfigValidation,
    IOI4ApplicationResources,
    IOI4Resource,
    MasterAssetModel,
    Profile,
    PublicationList,
    Resources,
    SubscriptionList, profileApplication, TypedEventEmitter, OI4ResourceEvent, OI4ResourceDefinition, ReferenceDesignation
} from '@oi4/oi4-oec-service-model';
import {extractProductInstanceUri} from '../../../src/application/OI4Resource';

export class MockedIApplicationResourceFactory {

    public static readonly OI4_ID = Oi4Identifier.fromString('fakeManufacturerUri/fakeModel/fakeProductCode/fakeSerialNumber');

    public static readonly getMockedIApplicationResourceInstance = (mam = MockedIApplicationResourceFactory.getMockedDefaultMasterAssetModel()): IOI4ApplicationResources => {
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
            mam: mam,
            metaDataLookup: MockedIApplicationResourceFactory.getMockedDefaultIContainerMetaData(),
            oi4Id: Oi4Identifier.fromString(extractProductInstanceUri(mam)),
            profile: new Profile(profileApplication.mandatory), //,
            publicationList: MockedIApplicationResourceFactory.getMockedPublicationList(),
            subscriptionList: MockedIApplicationResourceFactory.getMockedSubscriptionList(),
            addDataSet(): void {
                return;
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
            getSource(oi4Id: Oi4Identifier): IOI4Resource {
                return this.sources.get(oi4Id.toString());
            },
            setConfig(): boolean {
                return true;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
            on(_event: OI4ResourceEvent, _listener: (oi4Id: Oi4Identifier, resource: Resources) => void): TypedEventEmitter<OI4ResourceDefinition> {
                return new TypedEventEmitter<OI4ResourceDefinition>();
            },
            hasSource(oi4Id: Oi4Identifier): boolean {
                return this.sources.has(oi4Id.toString());
            },
            addSource(source: IOI4Resource | MasterAssetModel): IOI4Resource {
                 const newMock = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance(source instanceof MasterAssetModel ? source : source.mam);
                 const oi4Id = source instanceof MasterAssetModel ? source.getOI4Id() : source.oi4Id;
                 this.sources.set(oi4Id.toString(), newMock);
                 return newMock;
            },
            removeSource(oi4Id: Oi4Identifier): boolean {
                return this.sources.delete(oi4Id.toString());
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
            getReferenceDesignation(_oi4Id: Oi4Identifier): ReferenceDesignation {
                return this.referenceDesignation;
            },
            referenceDesignation: MockedIApplicationResourceFactory.getMockedReferenceDesignation()
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
                WriterGroupName: 'fakeFilter',
                DataSetWriterName: this.OI4_ID,
                ReplyTo: '42',
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
                    DataSetWriterName: this.OI4_ID,
                    Payload: {
                        fakeContent: 'fakeContent',
                    }
                }],
            }
        }
    };

    private static getMockedReferenceDesignation(): ReferenceDesignation {
        return {
            Function: {Value: 'fakeFunction', Local: 'fakeLocal', Parent: {Value: 'fakeParent', Local: 'fakeLocal', Oi4Identifier: this.OI4_ID}},
            Product: {Value: 'fakeProduct', Local: 'fakeLocal', Parent: {Value: 'fakeParent', Local: 'fakeLocal', Oi4Identifier: this.OI4_ID}},
            Location: {Value: 'fakeLocation', Local: 'fakeLocal', Parent: {Value: 'fakeParent', Local: 'fakeLocal', Oi4Identifier: this.OI4_ID}},
            resourceType(): Resources { return Resources.REFERENCE_DESIGNATION; }
        } as ReferenceDesignation;
    }

}
