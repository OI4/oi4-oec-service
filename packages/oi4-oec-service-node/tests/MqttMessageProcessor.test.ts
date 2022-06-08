import {LoggerItems, MockedLoggerFactory} from './utils/mockedLoggerFactory';
import {
    EDeviceHealth,
    IContainerConfigConfigName,
    IContainerState,
    IPublicationListObject,
    ISubscriptionListObject
} from '@oi4/oi4-oec-service-model';
import {
    EOPCUABaseDataType,
    EOPCUALocale,
    IOPCUALocalizedText,
    IOPCUAMetaData,
    IOPCUANetworkMessage
} from '@oi4/oi4-oec-service-opcua-model';
import {MqttMessageProcessor} from '../src/Utilities/Helpers/MqttMessageProcessor';

const getStandardNameDefinition = (): IOPCUALocalizedText => {
    return {locale: EOPCUALocale.enUS, text: 'a'};
}

const getStandardIContainerConfig = (): IContainerConfigConfigName => {
    return {
        name: getStandardNameDefinition(),
        defaultValue: undefined,
        mandatory: undefined,
        validation: undefined,
        description: undefined,
        value: 'val',
        type: EOPCUABaseDataType.Boolean
    };
};

const getMockedContainerStateInstance = (): IContainerState => {
    return {
        brokerState: false,
            config: {
        context: {name: getStandardNameDefinition()},
        logging: {
            auditLevel: getStandardIContainerConfig(),
                logFileSize: getStandardIContainerConfig(),
                logType: getStandardIContainerConfig(),
                name: getStandardNameDefinition()
        },
        registry:
        {
            name: getStandardNameDefinition(),
                description: undefined,
            developmentMode: getStandardIContainerConfig(),
            showRegistry: getStandardIContainerConfig()
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

describe('Unit test for MqttMessageProcessor', () => {

    it('If the serviceType is not "Registry" the oi4Id is not saved', async () => {
        const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
        const fakeLogFile: Array<string> = loggerItems.fakeLogFile;
        const containerState: IContainerState = getMockedContainerStateInstance();
        jest.mocked<IContainerState>(containerState);
        const mqttMessageProcessor: MqttMessageProcessor = new MqttMessageProcessor(loggerItems.fakeLogger, containerState, jest.fn(),jest.fn(),jest.fn());
    });

    it('If the serviceType is "Registry" the oi4Id is saved', async () => {

    });

});
