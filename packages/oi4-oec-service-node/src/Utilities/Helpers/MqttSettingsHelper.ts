import * as fs from 'fs';
import {Credentials, ValidatedCredentials} from './Types';

export class MqttSettingsHelper {

    fileLocation: string = undefined;

    constructor(location = 'run/secrets/mqtt_credentials') {
        this.fileLocation = location;
    }

    isBase64EncodingInvalid(encodedString: string): boolean {
        return btoa(atob(encodedString)) !== encodedString;
    }

    areEncodedCredentialsInvalid(encodedCredentials: string): ValidatedCredentials {
        if(encodedCredentials === '') {
            return {areInvalid: true, error: new Error('Credentials not found : empty file')};
        }

        if(this.isBase64EncodingInvalid(encodedCredentials)) {
            return {areInvalid: true, error: new Error('Credential file does not contain a valid base 64 string')};
        }

        return {areInvalid: false, error: undefined};
    }

    cleanCredentials(encodedCredentials: string): string {
        return encodedCredentials.trim().replace(/(\r\n|\n|\r)/gm, '');
    }

    fetchCredentials(): string {
        if (fs.existsSync(this.fileLocation)) {
            const encodedCredentials: string = fs.readFileSync(this.fileLocation,'utf8');
            const cleanedEncodedCredentials: string = this.cleanCredentials(encodedCredentials);
            const validationResult: ValidatedCredentials = this.areEncodedCredentialsInvalid(cleanedEncodedCredentials);

            if(validationResult.areInvalid) {
                throw validationResult.error;
            }

            return atob(cleanedEncodedCredentials);
        } else {
            throw new Error('Credentials file not found');
        }
    }

    getUserCredentials(): Credentials {
        const credentials = this.fetchCredentials();
        const splitCredentials = credentials.split(':', 2);
        return {username:splitCredentials[0], password:splitCredentials[1]}
    };

}
