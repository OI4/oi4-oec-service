import {
    EOPCUABaseDataType,
    EOPCUALocale,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {
    EDeviceHealth,
    ESubscriptionListConfig,
    IContainerConfigConfigName,
    IContainerSubscriptionList,
    IPublicationListObject,
    ISubscriptionListObject
} from '@oi4/oi4-oec-service-model';

export class MockedIContainerStateFactory {

    public static getMockedContainerStateInstance(): {
        publicationList: undefined; removeSubscriptionByTopic(_: string): void; addProfile(_: string): void; licenseText: { text: string; key: string }; subscriptionList: IContainerSubscriptionList; removePublicationByTag(_: string): void; dataLookup: {}; profile: undefined; brokerState: boolean; addSubscription(_: ISubscriptionListObject): void; health: { health: EDeviceHealth; healthScore: number }; addPublication(_: IPublicationListObject): void; setHealthState(_: number): void; license: { licenses: { components: { component: string; licAuthors: string[]; licAddText: string }[]; licenseId: string }[] }; metaDataLookup: undefined; rtLicense: { fakeRTLicense: string }; addDataSet(_: string, __: IOPCUANetworkMessage, ___: IOPCUAMetaData): void; mam: undefined; oi4Id: string; config: { registry: { name: IOPCUALocalizedText; description: IOPCUALocalizedText; developmentMode: IContainerConfigConfigName; showRegistry: IContainerConfigConfigName }; context: { name: IOPCUALocalizedText }; logging: { logType: IContainerConfigConfigName; auditLevel: IContainerConfigConfigName; name: IOPCUALocalizedText; logFileSize: IContainerConfigConfigName } }; addLicenseText(_: string, __: string): void; on(_: string, __: Function): void; setHealth(_: EDeviceHealth): void;
    } {
        return {
            brokerState: false,
            config: {
                context: {name: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeContext')},
                logging: {
                    auditLevel: MockedIContainerStateFactory.getDefaultStandardIContainerConfig(),
                    logFileSize: MockedIContainerStateFactory.getDefaultStandardIContainerConfig(),
                    logType: MockedIContainerStateFactory.getDefaultStandardIContainerConfig(),
                    name: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeName')
                },
                registry:
                    {
                        name: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeName'),
                        description: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeDescription'),
                        developmentMode: MockedIContainerStateFactory.getDefaultStandardIContainerConfig(),
                        showRegistry: MockedIContainerStateFactory.getDefaultStandardIContainerConfig()
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
            mam: undefined,
            metaDataLookup: undefined,
            oi4Id: 'fakeOi4ID',
            profile: undefined,
            publicationList: undefined,
            rtLicense: {fakeRTLicense: 'fakeRTLicense'},
            subscriptionList: MockedIContainerStateFactory.getDefaultIContainerSubscriptionList(),

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
            // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/explicit-function-return-type
            on(_: string, __: Function) {
                console.log('Called mocked on. Do nothing....');
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
            }
        };
    }

    private static getIOPCUALocalizedText(text: string): IOPCUALocalizedText {
        return {locale: EOPCUALocale.enUS, text: text};
    }

    private static getDefaultIContainerConfigValidation() {
        return {length: 0, min: 0, max: 0, pattern: 'fakePattern', values: ['fakeValue']}
    }

    private static getDefaultStandardIContainerConfig(): IContainerConfigConfigName {
        return {
            name: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeConfig'),
            defaultValue: 'fakeValue',
            mandatory: false,
            validation: MockedIContainerStateFactory.getDefaultIContainerConfigValidation(),
            description: MockedIContainerStateFactory.getIOPCUALocalizedText('fakeDescription'),
            value: 'fakeValue',
            type: EOPCUABaseDataType.String
        };
    };

    private static getDefaultIContainerSubscriptionList(): IContainerSubscriptionList {
        return {subscriptionList: [{topicPath: 'fakeTopicPath', interval: -1, config: ESubscriptionListConfig.NONE_0}]};
    }

    private static getDefaultKeyValueItem() {
        return {key: 'fakeKey', text: 'fakeText'};
    }

}