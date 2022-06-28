import {IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {indexOf} from 'lodash';
import {EventEmitter} from 'events';
import {ServiceTypes} from '@oi4/oi4-oec-service-model';

/**
 * The OI4RegistryManager class is a singleton that manages the OI4 registry.
 */
export namespace OI4RegistryManager {

    export const OI4_REGISTRY_CHANGED = 'oi4_registry_changed';
    const emitter: EventEmitter = new EventEmitter();

    let oi4Id: string = undefined;

    export function getOi4Id(): string {
        if(oi4Id === undefined) {
            throw new Error('Currently there is no oi4Id saved.');
        }

        return oi4Id;
    }

    export function checkForOi4Registry(parsedMessage: IOPCUANetworkMessage) {
        const publisherId = parsedMessage.PublisherId || '';
        if(publisherId.indexOf('/') == -1) {
            LOGGER.log('PublisherId does not respect the structure serviceType/appId')
            return;
        }

        const separatorPosition = indexOf(publisherId, '/');

        const serviceType = publisherId.substring(0, separatorPosition);
        if(serviceType !== ServiceTypes.REGISTRY){
            return;
        }

        saveCurrentOi4Id(publisherId.substring(separatorPosition + 1));
    }

    export function resetOI4RegistryManager() {
        oi4Id = undefined;
    }

    export function getEmitter(): EventEmitter {
        return emitter;
    }

    function saveCurrentOi4Id(newId: string) {
        if(newId === undefined || newId.length === 0) {
            LOGGER.log('Invalid oi4Id: either undefined or empty')
            return;
        }
        if(newId !== oi4Id) {
            emitter.emit(OI4_REGISTRY_CHANGED, oi4Id, newId);
            oi4Id = newId;
            LOGGER.log(`Saved registry OI4 ID: ${oi4Id}`);
        }
    }

}

