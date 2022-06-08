import {
    EOPCUABaseDataType,
    EOPCUALocale,
    IOPCUALocalizedText, IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {
    EDeviceHealth,
    IContainerConfigConfigName,
    IContainerState,
    IPublicationListObject, ISubscriptionListObject
} from '@oi4/oi4-oec-service-model';

export class MockedIContainerStateFactory {

    public static getStandardNameDefinition(): IOPCUALocalizedText {
        return {locale: EOPCUALocale.enUS, text: 'a'};
    }

    public static getStandardIContainerConfig(): IContainerConfigConfigName {
        return {
            name: MockedIContainerStateFactory.getStandardNameDefinition(),
            defaultValue: undefined,
            mandatory: undefined,
            validation: undefined,
            description: undefined,
            value: 'val',
            type: EOPCUABaseDataType.Boolean
        };
    };

    public static getMockedContainerStateInstance(): IContainerState {
        return {
            brokerState: false,
            config: {
                context: {name: MockedIContainerStateFactory.getStandardNameDefinition()},
                logging: {
                    auditLevel: MockedIContainerStateFactory.getStandardIContainerConfig(),
                    logFileSize: MockedIContainerStateFactory.getStandardIContainerConfig(),
                    logType: MockedIContainerStateFactory.getStandardIContainerConfig(),
                    name: MockedIContainerStateFactory.getStandardNameDefinition()
                },
                registry:
                    {
                        name: MockedIContainerStateFactory.getStandardNameDefinition(),
                        description: undefined,
                        developmentMode: MockedIContainerStateFactory.getStandardIContainerConfig(),
                        showRegistry: MockedIContainerStateFactory.getStandardIContainerConfig()
                    }
            },
            dataLookup: {},
            health: {health: EDeviceHealth.NORMAL_0, healthScore: 100},
            license:
                { licenses: [
                        {   licenseId: '1' ,
                            components: [
                                { licAddText:'license_1',
                                    component:'comp',
                                    licAuthors: ['a']
                                }
                            ]
                        }
                    ]
                },
            licenseText: undefined,
            mam: undefined,
            metaDataLookup: undefined,
            oi4Id: '',
            profile: undefined,
            publicationList: undefined,
            rtLicense: undefined,
            subscriptionList: undefined,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addDataSet(_: string, __: IOPCUANetworkMessage, ___: IOPCUAMetaData): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addLicenseText(_: string, __: string): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            addProfile(_: string): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addPublication(_: IPublicationListObject): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            addSubscription(_: ISubscriptionListObject): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            on(_: string, __: Function) {
                return undefined;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            removePublicationByTag(_: string): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            removeSubscriptionByTopic(_: string): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            setHealth(_: EDeviceHealth): void {
                return;
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            setHealthState(_: number): void {
                return;
            }
        };
    }

}