import {ClientCallbacksHelper} from '@oi4/oi4-oec-service-node/dist/Utilities/Helpers/ClientCallbacksHelper';
import {OI4Application} from '@oi4/oi4-oec-service-node';
import {ServiceDemoOI4ApplicationResources} from './ServiceDemoOI4ApplicationResources';

export class ServiceDemoClientCallbacksHelper extends ClientCallbacksHelper {

    async onClientConnectCallback(oi4application: OI4Application) {
        super.onClientConnectCallback(oi4application);
        const applicationResources = oi4application.applicationResources as ServiceDemoOI4ApplicationResources;
        for (const resource of applicationResources.subResources.values()){
            oi4application.sendMasterAssetModel(resource.mam);
        }
    }

}
