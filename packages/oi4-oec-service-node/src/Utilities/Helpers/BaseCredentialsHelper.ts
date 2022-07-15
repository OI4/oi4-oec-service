import {Credentials, IBaseSettingsPaths} from '../../application/MqttSettings';
import {existsSync, readFileSync} from 'fs';
import {indexOf} from 'lodash';

export class BaseCredentialsHelper {

    protected readonly settingsPaths: IBaseSettingsPaths;

    constructor(settingsPaths: IBaseSettingsPaths) {
        this.settingsPaths = settingsPaths;
    }

    protected static decodeFromBase64(string: string) {
        const buff = Buffer.from(string, 'base64');
        return buff.toString('utf-8');
    }


    protected static loadAndDecodeSecret(secretFile: string): string {
        const encodedSecret: string = readFileSync(secretFile,'utf8');
        if(encodedSecret === '') {
            throw new Error('Empty secret');
        }
        const cleanedSecret = encodedSecret.trim().replace(/(\r\n|\n|\r)/gm, '')
        return this.decodeFromBase64(cleanedSecret);
    }

    protected static validateAndParseCredentials(decodedCredentials: string): Credentials {
        const usernamePasswordSeparatorPosition = indexOf(decodedCredentials, ':');
        if( decodedCredentials.startsWith(':') ||
            usernamePasswordSeparatorPosition == -1) {
            throw new Error('Credentials are does not respect the format "username:password"');
        }

        const username = decodedCredentials.substring(0, usernamePasswordSeparatorPosition);
        if(!this.isUsernameValid(username)) {
            throw new Error('Invalid username');
        }

        const password = decodedCredentials.substring(usernamePasswordSeparatorPosition+1, decodedCredentials.length);

        return {username: username, password: password}
    }

    protected static isUsernameValid(candidateUsername: string) {
        // The username will match the regexp in case it contains and invalid char,
        // therefore if the username match the regexp is invalid.
        const regex = /[^a-zA-Z0-9-._~@]+/;
        return !regex.test(candidateUsername);
    }

    loadPassphrase(): string | undefined {
        const passphrase = this.settingsPaths.passphrase;
        if (!existsSync(passphrase)) {
            return undefined;
        }
        return BaseCredentialsHelper.loadAndDecodeSecret(passphrase);
    }

    loadUserCredentials(): Credentials {
        const credentials = this.settingsPaths.credentials;
        if (!existsSync(credentials)) {
            throw new Error('Credentials file not found');
        }

        const cleanedEncodedCredentials: string = BaseCredentialsHelper.loadAndDecodeSecret(credentials);

        //If the credentials are invalid, then an error is thrown
        return BaseCredentialsHelper.validateAndParseCredentials(cleanedEncodedCredentials);
    };
}
