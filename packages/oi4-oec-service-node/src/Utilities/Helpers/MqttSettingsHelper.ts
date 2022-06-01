import * as fs from 'fs';
import {Credentials} from './Types';
import {indexOf} from 'lodash';

export class MqttSettingsHelper {

    private readonly fileLocation: string = undefined;

    constructor(location = 'run/secrets/mqtt_credentials') {
        this.fileLocation = location;
    }

    private static decodeFromBase64(string: string) {
        const buff = Buffer.from(string, 'base64');
        return buff.toString('utf-8');
    }

    private static checkUsername(candidateUsername: string) {
        //TODO fix the regex
        const regex = RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');
        return candidateUsername.match(regex);
    }

    private static validateAndDecodeCredentials(encodedCredentials: string): Credentials {
        if(encodedCredentials === '') {
            throw new Error('Credentials not found : empty file');
        }

        const decodedCredentials = this.decodeFromBase64(encodedCredentials);
        const usernamePasswordSeparatorPosition = indexOf(decodedCredentials, ':');
        if( decodedCredentials.startsWith(':') ||
            usernamePasswordSeparatorPosition == -1) {
            throw new Error('Credentials are does not respect the format "username:password"');
        }

        const username = decodedCredentials.substring(0, usernamePasswordSeparatorPosition);
        if(this.checkUsername(username)) {
            throw new Error('Invalid username');
        }

        const password = decodedCredentials.substring(usernamePasswordSeparatorPosition+1, decodedCredentials.length);

        return {username: username, password: password}
    }

    private static cleanCredentials(encodedCredentials: string): string {
        return encodedCredentials.trim().replace(/(\r\n|\n|\r)/gm, '');
    }

    loadUserCredentials(): Credentials {
        if (!fs.existsSync(this.fileLocation)) {
            throw new Error('Credentials file not found');
        }

        const encodedCredentials: string = fs.readFileSync(this.fileLocation,'utf8');
        const cleanedEncodedCredentials: string = MqttSettingsHelper.cleanCredentials(encodedCredentials);

        //If the credentials are invalid, then an error is thrown
        return MqttSettingsHelper.validateAndDecodeCredentials(cleanedEncodedCredentials);
    };

}
