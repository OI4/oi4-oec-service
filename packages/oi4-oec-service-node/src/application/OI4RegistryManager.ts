import {ESyslogEventFilter, IOPCUANetworkMessage, Oi4Identifier, ServiceTypes} from '@oi4/oi4-oec-service-model';
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {EventEmitter} from 'events';

/**
 * The OI4RegistryManager class is a singleton that manages the OI4 registry.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace OI4RegistryManager {

    export const oi4RegistryChanged = 'oi4_registry_changed';
    const emitter: EventEmitter = new EventEmitter();

    let oi4Id: Oi4Identifier = undefined;

    function saveCurrentOi4Id(newId: Oi4Identifier): void {
        if (newId === undefined) {
            LOGGER.log('Invalid oi4Id: either undefined or empty')
            return;
        }
        if (!newId.equals(oi4Id)) {
            emitter.emit(oi4RegistryChanged, oi4Id, newId);
            oi4Id = newId;
            LOGGER.log(`Saved registry OI4 ID: ${oi4Id}`);
        }
    }

    export function getOi4Id(): Oi4Identifier {
        if (oi4Id === undefined) {
            throw new Error('Currently there is no oi4Id saved.');
        }

        return oi4Id;
    }

    export function checkForOi4Registry(parsedMessage: IOPCUANetworkMessage) {
        const publisherId = parsedMessage.PublisherId || '';
        if (publisherId.indexOf('/') == -1) {
            LOGGER.log('PublisherId does not respect the structure serviceType/appId')
            return;
        }

        const separatorPosition = publisherId.indexOf('/');

        const serviceType = publisherId.substring(0, separatorPosition);
        if (serviceType !== ServiceTypes.REGISTRY) {
            return;
        }
        try {
            const oi4Id = Oi4Identifier.fromString(publisherId.substring(separatorPosition + 1));
            saveCurrentOi4Id(oi4Id);
        } catch (err) {
            LOGGER.log(`Couldn't retrieve oi4id while checking if the publisherid contained an oi4 registry: ${err.message}`, ESyslogEventFilter.debug);
        }
    }

    export function resetOI4RegistryManager() {
        oi4Id = undefined;
    }

    export function getEmitter(): EventEmitter {
        return emitter;
    }

}

