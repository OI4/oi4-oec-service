import * as fs from 'fs';
import {Credentials} from './Types';

export class MqttSettingsHelper {

    fileLocation: string = undefined;

    constructor(location = 'run/secrets/mqtt_credentials') {
        this.fileLocation = location;
    }

    private validateAndDecodeCredentials(encodedCredentials: string): string {
        if(encodedCredentials === '') {
            throw new Error('Credentials not found : empty file');
        }

        //If the string contains an invalid character, atob will fail
        const decodedCredentials = atob(encodedCredentials);
        //Check if the string is base64 validly encoded
        if(btoa(decodedCredentials) !== encodedCredentials) {
            throw new Error('Credential file does not contain a valid base 64 string');
        }

        if( decodedCredentials.startsWith(':') ||
            decodedCredentials.endsWith(':') ||
            decodedCredentials.split(':').length != 2) {
            throw new Error('Credential are does not respect the format "username:password"');
        }

        return decodedCredentials;
    }

    private cleanCredentials(encodedCredentials: string): string {
        return encodedCredentials.trim().replace(/(\r\n|\n|\r)/gm, '');
    }

    private readAndDecodeCredentials(): string {
        if (!fs.existsSync(this.fileLocation)) {
            throw new Error('Credentials file not found');
        }

        const encodedCredentials: string = fs.readFileSync(this.fileLocation,'utf8');
        const cleanedEncodedCredentials: string = this.cleanCredentials(encodedCredentials);

        //If the credentials are invalid, then an error is thrown
        return this.validateAndDecodeCredentials(cleanedEncodedCredentials);
    }

    loadUserCredentials(): Credentials {
        const credentials = this.readAndDecodeCredentials();
        const splitCredentials = credentials.split(':', 2);
        return {username:splitCredentials[0], password:splitCredentials[1]}
    };

}
