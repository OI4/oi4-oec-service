import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import fs = require('fs'); /*tslint:disable-line*/
import {MqttSettings} from '../src/messageBus/MqttSettings';
import {OI4MessageBus} from '../src/messageBus/OI4MessageBus';
import {EDeviceHealth, IContainerHealth, IContainerState} from '@oi4/oi4-oec-service-model';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {MqttCredentialsHelper} from '../src/messageBus/OI4MessageBusFactory';

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
    return {
        oi4Id: '1',
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
        subscriptionList: {
            subscriptionList: []
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        on(event: string, listener: Function) {
            return this;
        }
    } as IContainerState
}


describe('Connection to MQTT with TLS', () => {

    const onEvent = () => {
        return jest.fn(async (event, cb) => {
            await cb(event);
        });
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const publish = jest.fn((topic, _) => {
        return topic;
    });

    beforeAll(() => {
        jest.useFakeTimers();
        jest.resetAllMocks();
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(MqttCredentialsHelper.prototype, 'loadUserCredentials').mockReturnValue({username:'test-user', password: '1234'});
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllTimers();
        jest.resetModules();
        jest.resetAllMocks();
    });
    it('should send birth message on connect',  () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            () => {
                return {
                    connected: true,
                    reconnecting: false,
                    publish: publish,
                    subscribe: jest.fn(),
                    on: onEvent(),
                }
            }
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function,ms: number)=>{
            cb();
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBus = new OI4MessageBus(getContainerInfo(), mqttOpts);

        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/mam/${getContainerInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify(getContainerInfo().mam)));
    });

    it('should send close message on close',  async () => {

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
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        jest.spyOn(global, 'setInterval').mockImplementation((cb: Function,ms: number)=>{
            cb();
        });

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBus = new OI4MessageBus(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.connected).toBeTruthy();
        expect(publish).toHaveBeenCalledWith(
            expect.stringContaining(`oi4/${getContainerInfo().mam.DeviceClass}/${getContainerInfo().oi4Id}/pub/mam/${getContainerInfo().oi4Id}`),
            expect.stringContaining(JSON.stringify({health: EDeviceHealth.NORMAL_0, healthScore: 0 } as IContainerHealth)));
    });


    it('should set will message on create',  () => {

        jest.spyOn(mqtt, 'connect').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            (res) => {
                return {...{options: res}, ...{on: jest.fn(), publish: jest.fn()}};
            }
        );

        const mqttOpts: MqttSettings = getStandardMqttConfig();
        const oi4messagebus: OI4MessageBus = new OI4MessageBus(getContainerInfo(), mqttOpts);
        expect(oi4messagebus.mqttClient.options.will?.payload)
            .toContain(JSON.stringify({health: EDeviceHealth.FAILURE_1, healthScore: 0} as IContainerHealth));
    });

});
