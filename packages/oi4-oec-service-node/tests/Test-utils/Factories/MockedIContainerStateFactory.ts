import {
    EOPCUABaseDataType,
    EOPCUALocale,
    EOPCUAMessageType,
    IMasterAssetModel,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {
    EDeviceHealth,
    EPublicationListConfig,
    EPublicationListExplicit,
    ESubscriptionListConfig,
    IContainerConfigConfigName,
    IContainerMetaData,
    IContainerProfile,
    IContainerPublicationList,
    IApplicationResources,
    IContainerSubscriptionList,
    IPublicationListObject,
    ISubscriptionListObject
} from '@oi4/oi4-oec-service-model';

export class MockedIContainerStateFactory {

    public static getMockedContainerStateInstance= (): IApplicationResources => {
        return {
            brokerState: false,
            config: {
                context: {name: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeContext')},
                logging: {
                    auditLevel: MockedIContainerStateFactory.getMockedDefaultStandardIContainerConfig(),
                    logFileSize: MockedIContainerStateFactory.getMockedDefaultStandardIContainerConfig(),
                    logType: MockedIContainerStateFactory.getMockedDefaultStandardIContainerConfig(),
                    name: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeName')
                },
                registry:
                    {
                        name: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeName'),
                        description: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeDescription'),
                        developmentMode: MockedIContainerStateFactory.getMockedDefaultStandardIContainerConfig(),
                        showRegistry: MockedIContainerStateFactory.getMockedDefaultStandardIContainerConfig()
                    }
            },
            dataLookup: {},
            health: {health: EDeviceHealth.NORMAL_0, healthScore: 100},
            license:
                { licenses: [
                        {   licenseId: '1' ,
                            components: [
                                {
                                    licAddText:'fakeLicence',
                                    component:'fakeComponent',
                                    licAuthors: ['John Doe, Mary Poppins, Bilbo Baggins, John Rambo, Homer Simpson']
                                }
                            ]
                        }
                    ]
                },
            licenseText: MockedIContainerStateFactory.getDefaultKeyValueItem(),
            mam: MockedIContainerStateFactory.getMockedDefaultIMasterAssetModel(),
            metaDataLookup: MockedIContainerStateFactory.getMockedDefaultIContainerMetaData(),
            oi4Id: 'fakeOi4ID',
            profile: MockedIContainerStateFactory.getMockedDefaultIContainerProfile(),
            publicationList: MockedIContainerStateFactory.getMockedDefaultIPublicationListObject(),
            rtLicense: {fakeRTLicense: 'fakeRTLicense'},
            subscriptionList: MockedIContainerStateFactory.getMockedDefaultIContainerSubscriptionList(),

            // eslint-disable-next-line @typescript-eslint/naming-convention
            addDataSet(_: string, __: IOPCUANetworkMessage, ___: IOPCUAMetaData): void {
                console.log('Called mocked addDataSet. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addLicenseText(_: string, __: string): void {
                console.log('Called mocked addLicenseText. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/naming-convention
            addProfile(_: string): void {
                console.log('Called mocked addProfile. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addPublication(_: IPublicationListObject): void {
                console.log('Called mocked addPublication. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addSubscription(_: ISubscriptionListObject): void {
                console.log('Called mocked addSubscription. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            removePublicationByTag(_: string): void {
                console.log('Called mocked removePublicationByTag. Do nothing....');
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            removeSubscriptionByTopic(_: string): void {
                console.log('Called mocked removeSubscriptionByTopic. Do nothing....');
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
            on(_: string, __: Function): IApplicationResources {
                console.log('Called mocked on. Do nothing....');
                return undefined;
            }
        };
    }

    private static getMockedDefaultStandardIContainerConfig(): IContainerConfigConfigName {
        return {
            name: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeConfig'),
            defaultValue: 'fakeValue',
            mandatory: false,
            validation: MockedIContainerStateFactory.getMockedDefaultIContainerConfigValidation(),
            description: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeDescription'),
            value: 'fakeValue',
            type: EOPCUABaseDataType.String
        };
    };

    private static getMockedDefaultIContainerConfigValidation() {
        return {length: 0, min: 0, max: 0, pattern: 'fakePattern', values: ['fakeValue']}
    }

    private static getDefaultKeyValueItem() {
        return {key: 'fakeKey', text: 'fakeText'};
    }

    private static getMockedDefaultIMasterAssetModel(): IMasterAssetModel{
        return {
            ManufacturerUri: 'fakeManufacturerUri',
            Model: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeModel' ),
            ProductCode: 'fakeProductCode',
            HardwareRevision: 'fakeHardwareRevision',
            SoftwareRevision: 'fakeSoftwareRevision',
            DeviceRevision: 'fakeDeviceRevision',
            DeviceManual: 'fakeDeviceManual',
            DeviceClass: 'fakeDeviceClass',
            SerialNumber: 'fakeSerialNumber',
            ProductInstanceUri: 'fakeProductInstanceURI',
            RevisionCounter: -1,
            Description: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeDescription' ),
            Manufacturer: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeManufacturer' )
        };
    };

    private static getMockedDefaultIContainerMetaData(): IContainerMetaData {
        return {fakeKey: {
                MessageId: 'fakeMessageId',
                MessageType: EOPCUAMessageType.uaData,
                PublisherId: 'fakePublisherId',
                DataSetWriterId: -1,
                filter: 'fakeFilter',
                subResource: 'fakeSubResource',
                correlationId: 'fakeCorrelationId',
                MetaData: {
                    name: 'fakeName',
                    description: MockedIContainerStateFactory.getMockedIOPCUALocalizedText('fakeDescription' ),
                    fields: [],
                    dataSetClassId: 'fakeDataSetClassId',
                    configurationVersion: {majorVersion: -1, minorVersion: -1},
                }
            }};
    }

    private static getMockedDefaultIPublicationListObject(): IContainerPublicationList {
        return {publicationList: [{resource: 'fakeResource', tag: 'fakeTag', DataSetWriterId: -1, oi4Identifier: 'fakeOi4Identifier', active: false, explicit: EPublicationListExplicit.EXPL_OFF_0, interval: -1, precisions: -1, config: EPublicationListConfig.NONE_0}]};
    }

    private static getMockedDefaultIContainerProfile(): IContainerProfile {
        return {resource: ['fakeProfile']};
    }

    private static getMockedDefaultIContainerSubscriptionList(): IContainerSubscriptionList {
        return {subscriptionList: [{topicPath: 'fakeTopicPath', interval: -1, config: ESubscriptionListConfig.NONE_0}]};
    }

    private static getMockedIOPCUALocalizedText(text: string): IOPCUALocalizedText {
        return {locale: EOPCUALocale.enUS, text: text};
    }

}
