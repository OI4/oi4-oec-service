import {LoggerItems, MockedLoggerFactory} from '../mock/MockedLoggerFactory';
import {ServiceDemoMqttMessageProcessor} from '../../src/application/ServiceDemoMqttMessageProcessor';
import {setLogger} from '@oi4/oi4-oec-service-logger';
import {IOPCUANetworkMessage, Oi4Identifier, OPCUABuilder, ServiceTypes} from '@oi4/oi4-oec-service-opcua-model';
import {Resource} from '@oi4/oi4-oec-service-model';
import {IOI4Application, TopicMethods} from '@oi4/oi4-oec-service-node';
import {TopicInfo} from '@oi4/oi4-oec-service-node';
import fs from 'fs';

describe('ServiceDemoMqttMessageProcessor.ts test', () => {

    const loggerItems: LoggerItems = MockedLoggerFactory.getLoggerItems();
    const fakeLogFile: Array<string> = loggerItems.fakeLogFile;

    const OI4_ID = Oi4Identifier.fromString('uri/model/productCode/serialNumber');
    const message = fs.readFileSync(`${__dirname}/../__fixtures__/mamNetworkMessage.json`, 'utf-8');
    const topic = `oi4/${ServiceTypes.OT_CONNECTOR}/acme.com/OEC%20Utility/OEC-ACME-UTILITY/my-device/${TopicMethods.PUB}/${Resource.MAM}/acme.com/rock_solid_weather_sensor/OEC-ACME-UTILITY/F12SN894`;
    const processor = new ServiceDemoMqttMessageProcessor();

    const application: IOI4Application = {
        oi4Id: OI4_ID,
        applicationResources: undefined,
        serviceType: undefined,
        topicPreamble: '',
        builder: undefined,
        client: undefined,
        clientPayloadHelper: undefined,
        addSubscription: undefined,
        removeSubscription: undefined,
        sendResource: undefined,
        sendMetaData: undefined,
        sendMasterAssetModel: undefined,
        sendEvent: undefined,
        sendEventStatus: undefined,
        sendData: undefined,
        getConfig: undefined,
        addListener: undefined,
        on: undefined,
        once: undefined,
        removeListener: undefined,
        off: undefined,
        removeAllListeners: undefined,
        setMaxListeners: undefined,
        getMaxListeners: undefined,
        listeners: undefined,
        rawListeners: undefined,
        emit: undefined,
        listenerCount: undefined,
        prependListener: undefined,
        prependOnceListener: undefined,
        eventNames: undefined
    };

    beforeEach(() => {
        //Flush the messages log
        fakeLogFile.splice(0, fakeLogFile.length);
        setLogger(loggerItems.fakeLogger);
    });

    it('should handle foreign message with processMqttMessage', async () => {
        const opcUaBuilder = new OPCUABuilder(OI4_ID, ServiceTypes.AGGREGATION);
        await processor.processMqttMessage(topic, Buffer.from(message), opcUaBuilder, application);
        assertLogs();
    });

    it('should handle local message straight', async () => {
        const parsedMessage: IOPCUANetworkMessage = JSON.parse(message.toString());

        const topicInfo: TopicInfo = {
            topic: topic,
            appId: Oi4Identifier.fromString('acme.com/OEC%20Utility/OEC-ACME-UTILITY/my-device'),
            method: TopicMethods.PUB,
            resource: Resource.MAM,
            oi4Id: new Oi4Identifier('acme.com','rock_solid_weather_sensor','OEC-ACME-UTILITY','F12SN894'),
            serviceType: ServiceTypes.OT_CONNECTOR
        }

        await processor.handleForeignMessage(topicInfo, parsedMessage);
        assertLogs();
    });

    const assertLogs = () => {
        expect(fakeLogFile.length).toBe(1);
        expect(fakeLogFile[0]).toBe(`Foreign message from: acme.com/OEC%2520Utility/OEC-ACME-UTILITY/my-device with messageId: 1658730472036-Utility/acme.com/OEC%20Utility/OEC-ACME-UTILITY/my-device`);
    };
});
