import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttSettings} from '../../src/messageBus/MqttSettings';
import {OI4MessageBus} from '../../src/messageBus/OI4MessageBus';
import {EDeviceHealth, IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {MqttCredentialsHelper} from '../../src/messageBus/OI4MessageBusFactory';
import {AsyncClientEvents} from '../../src/Utilities/Helpers/Enums';
import {ResourceType} from '../../src/Utilities/Helpers/Enums';


// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const onEvent = () => jest.fn(async (event, cb) => {
        await cb(event);
});


// eslint-disable-next-line @typescript-eslint/naming-convention
const publish = jest.fn((topic, _) => {
    return topic;
});

const getStandardMqttConfig = (): MqttSettings => {
    return {
        host: 'localhost',
        port: 8883,
        keepalive: 60,
        reconnectPeriod: 1000,
        protocol: 'mqtts'
    };
}

const getContainerInfo = (): IContainerState => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
        oi4Id: '1',
        health: {health: EDeviceHealth.NORMAL_0, healthScore: 100},
        mam: {
            DeviceClass: 'oi4',
            ManufacturerUri: 'test',
            Model: {locale: EOPCUALocale.enUS, text: 'text'},
            Description: {locale: EOPCUALocale.enUS, text: 'text'},
            DeviceManual: '',
            Manufacturer: {locale: EOPCUALocale.enUS, text: 'text'},
            HardwareRevision: '1.0',
            ProductCode: '213dq',
            DeviceRevision: '1.0',
            SerialNumber: '23kl41oßmß132',
            SoftwareRevision: '1.0',
            RevisionCounter: 1,
            ProductInstanceUri: 'wo/'
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        dataLookup: {'tag-01':{MessageId: '1'}, 'tag-02':{MessageId: '2'}},
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        metaDataLookup: {'tag-01': {MessageId: 'meta-01'}, 'tag-02': {MessageId: 'meta-02'}},
        subscriptionList: {
            subscriptionList: []
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: jest.fn()
    }
}


describe('OI4MessageBus test', () => {

    beforeAll(() => {
        jest.useFakeTimers();
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function,ms: number)=>{
            cb();
        });
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(MqttCredentialsHelper.prototype, 'loadUserCredentials').mockReturnValue({username:'test-user', password: '1234'});
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        jest.clearAllTimers();

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    on:  onEvent()
                }
            }
        );
    });

    afterAll(() => {
        jest.resetModules();
    });

    it('should trigger all events',  async () => {
        const onMock = onEvent();
        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    on:  onMock
                }
            }
        );

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        new OI4MessageBus(getContainerInfo(), mqttOpts);
        const events = onMock.mock.calls.map(keyPair => keyPair[0]);
        const setOfEvents = new Set<string>(Object.values(AsyncClientEvents)
            .filter(event => event !== AsyncClientEvents.MESSAGE && event !== AsyncClientEvents.RESOURCE_CHANGED));

        for(const event of events) {
            expect(setOfEvents.has(event)).toBeTruthy();
        }

    });


    it('should trigger resourceChanged',   (done) => {

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const onResourceMock = jest.fn( (event, cb) => {
            cb(event);
            expect(event).toBe(AsyncClientEvents.RESOURCE_CHANGED);
            done()
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        container.on = onResourceMock;
        new OI4MessageBus(container, mqttOpts);
    });

    it('should trigger health from resourceChangedCallback',   (done) => {

        const mockSendResource = jest.spyOn(OI4MessageBus.prototype, 'sendResource').mockResolvedValue();
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const onResourceMock = jest.fn( (_, cb) => {
            cb(ResourceType.HEALTH);
            expect(mockSendResource).toHaveBeenCalledWith(expect.stringContaining('health'), '', container.oi4Id);
            mockSendResource.mockRestore();
            done();
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        container.on = onResourceMock;
        new OI4MessageBus(container, mqttOpts);
    });

    it('should send specific metadata by tagname',   async () => {

        const tagName = 'tag-01'
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/metadata/${tagName}`),
            expect.stringContaining(JSON.stringify({MessageId: 'meta-01' })));
    });

    it('should send all metadata if tagname not specified',   async () => {

        const tagName = ''
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendMetaData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/metadata`),
            expect.stringContaining(JSON.stringify(getContainerInfo().metaDataLookup)));
    });

    it('should send specific data by tagname',   async () => {

        const tagName = 'tag-01'
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/data/${tagName}`),
            expect.stringContaining(JSON.stringify({MessageId: '1' })));
    });

    it('should send all data if tagname not specified',   async () => {

        const tagName = ''
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendData(tagName);
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/data`),
            expect.stringContaining(JSON.stringify(getContainerInfo().dataLookup)));
    });

    it('should  send resource with valid filter',   async () => {

        const filter = '1'
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendResource('health', '', filter);
        expect(publish).toHaveBeenCalledWith(
            expect.stringMatching(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/health/${filter}`),
            expect.stringContaining(JSON.stringify(getContainerInfo().health)));
    });

    it('should not send resource with invalid zero filter',   async () => {

        const filter = '0'
        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const container = getContainerInfo();
        const oi4MessageBus = new OI4MessageBus(container, mqttOpts);
        await oi4MessageBus.sendResource('health', '', filter);
        expect(publish).not.toHaveBeenCalledWith(expect.stringMatching(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/health/${filter}`), expect.stringContaining(JSON.stringify(getContainerInfo().health)))
    });

});
