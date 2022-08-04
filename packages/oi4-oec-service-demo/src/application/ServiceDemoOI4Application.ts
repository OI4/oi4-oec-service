import {
    ClientCallbacksHelper,
    ClientPayloadHelper,
    MqttMessageProcessor,
    MqttSettings,
    OI4Application
} from '@oi4/oi4-oec-service-node';
import {IOI4ApplicationResources, OI4Payload, Resource} from '@oi4/oi4-oec-service-model';
import {OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {ServiceDemoOI4ApplicationResources} from './ServiceDemoOI4ApplicationResources';
import {WeatherService} from '../weather/WeatherService';
import {Coordinates} from '../weather/WeatherServiceModel';

export class ServiceDemoOI4Application extends OI4Application {

    dataSendInterval: number = 60000;
    private readonly weatherService;

    constructor(applicationResources: IOI4ApplicationResources, mqttSettings: MqttSettings, opcUaBuilder: OPCUABuilder, clientPayloadHelper: ClientPayloadHelper, clientCallbacksHelper: ClientCallbacksHelper, mqttMessageProcessor: MqttMessageProcessor, appid: string) {
        super(applicationResources, mqttSettings, opcUaBuilder, clientPayloadHelper, clientCallbacksHelper, mqttMessageProcessor);
        this.weatherService = new WeatherService(appid);
        this.initDataPublishing();
    }

    private initDataPublishing() {
        setInterval(async () => {
            const applicationResources = this.applicationResources as ServiceDemoOI4ApplicationResources;
            for (const asset of applicationResources.assets) {
                const coords: Coordinates = {lon: asset.location.longitude, lat: asset.location.latitude};
                const response = await this.weatherService.getWeather(coords).catch(err => {
                    console.error(err);
                });
                if (response) {
                    const pv: ProcessValue = {
                        pv: response.main.temp,
                        sv_1: response.main.pressure,
                        sv_2: response.main.humidity,

                        resourceType(): Resource {
                            return Resource.DATA;
                        }
                    };
                    console.log(pv);
                    await this.sendData(asset.toMasterAssetModel().getOI4Id(), pv, 'oi4_pv');
                }
            }
        }, this.dataSendInterval); // send all weather data messages every 60 seconds
    }
}

interface ProcessValue extends OI4Payload {
    pv: number;
    sv_1: number;
    sv_2: number;
}
