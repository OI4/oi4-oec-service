import {MqttCredentialsHelper} from '../../src';
import {IMqttSettingsPaths} from '../../src';
import {ISettingsPaths} from '@oi4/oi4-oec-service-node';
import path from 'path';

const newMqttSettingsPaths = (credentials: string, passphrase = ''): IMqttSettingsPaths => {
    return {
        brokerConfig: '',
        caCertificate: '',
        privateKey: '',
        clientCertificate: '',
        passphrase: passphrase,
        credentials: credentials
    }
};

const newSettingsPaths = (credentials: string, passphrase = ''): ISettingsPaths => {
    return {
        mqttSettings: newMqttSettingsPaths(credentials, passphrase),
        applicationSpecificStorages: undefined,
        certificateStorage: '',
        secretStorage: '',
    };
}

describe('Unit test for MqttCredentialsHelper', () => {

    const testAgainstCredentialFile = (location: string, message: string): void => {
        const paths = newSettingsPaths(location);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        expect(() => {
            mqttSettingsHelper.loadUserCredentials();
        }).toThrowError(new Error(message));
    }

    it('Credentials should be correctly read from file', async () => {
        const paths = newSettingsPaths(`${__dirname}/../__fixtures__/secrets/correct_credentials.txt`);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        const credentials = mqttSettingsHelper.loadUserCredentials();
        expect(credentials).toBeDefined();
        expect(credentials.username).toBe('goofy@supergoof.com');
        expect(credentials.password).toBe('some_password');
    });

    it('If the credential file is not found an error is thrown', async () => {
        const file = `${__dirname}/../__fixtures__/secrets/credentials_fake.txt`;
        testAgainstCredentialFile(file, `Credentials file not found at ${path.resolve(file)}`);
    });

    it('If the credential file is empty an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/../__fixtures__/secrets/empty_credentials.txt`, 'Empty secret');
    });

    it('If the credential file contains a string not in the format username:password an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/../__fixtures__/secrets/credentials_wrong_format.txt`, 'Credentials are does not respect the format "username:password"');
    });

    it('If the credential file contains an invalid username an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/../__fixtures__/secrets/credentials_invalid_username.txt`, 'Invalid username');
    });

    it('Passphrase should be correctly read from file', async () => {
        const paths = newSettingsPaths('', `${__dirname}/../__fixtures__/secrets/passphrase.txt`);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        const passphrase = mqttSettingsHelper.loadPassphrase();
        expect(passphrase).toBeDefined();
        expect(passphrase).toBe('MySuperSecretPassword');
    });

    it('If the passphrase file is not found undefined is returned', async () => {
        const paths = newSettingsPaths('', `${__dirname}/../__fixtures__/secrets/passphrase_fake.txt`);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        expect(mqttSettingsHelper.loadPassphrase()).toBeUndefined();
    });

    it('If the passphrase file is not found undefined is returned', async () => {
        const paths = newSettingsPaths('', `${__dirname}/../__fixtures__/secrets/empty_credentials.txt`);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        expect(() => {
            mqttSettingsHelper.loadPassphrase();
        }).toThrowError(new Error('Empty secret'));
    });
});
