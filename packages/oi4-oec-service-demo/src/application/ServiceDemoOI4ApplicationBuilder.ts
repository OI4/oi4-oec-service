import {OI4ApplicationBuilder} from '@oi4/oi4-oec-service-node/dist/application/OI4Application';
import {ServiceDemoOI4Application} from './ServiceDemoOI4Application';
import fs from 'fs';
import {ISettingsPaths} from '@oi4/oi4-oec-service-node';

export class ServiceDemoOI4ApplicationBuilder extends OI4ApplicationBuilder {

    appid: string;

    withAppid(paths: ISettingsPaths) {
        const appConfig = `${paths.applicationSpecificStorages.configuration}/app.json`;
        if (!fs.existsSync(appConfig)) {
            throw new Error(`Application configuration ${appConfig} does not exist`);
        }

        this.appid = JSON.parse(fs.readFileSync(appConfig, 'utf-8')).appid;
        return this;
    }

    protected newOI4Application() {
        return new ServiceDemoOI4Application(this.applicationResources, this.mqttSettings, this.opcUaBuilder, this.clientPayloadHelper, this.clientCallbacksHelper, this.mqttMessageProcessor, this.appid);
    }
}
