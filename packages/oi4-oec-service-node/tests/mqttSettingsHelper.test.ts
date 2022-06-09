import {MqttCredentialsHelper} from '../src/messageBus/OI4MessageBusFactory';
import {IMqttSettingsPaths} from "../src/messageBus/MqttSettings";

const newSettingsPaths = (credentials: string): IMqttSettingsPaths => {
    return {
        brokerConfig: '',
        caCertificate: '',
        privateKey: '',
        clientCertificate: '',
        passphrase: '',
        credentials: credentials
    }
};

describe('Unit test for MqttCredentialsHelper', () => {

    it('Credentials should be correctly read from file', async () => {
        const paths = newSettingsPaths(`${__dirname}/__fixtures__/correct_credentials.txt`);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        const credentials = mqttSettingsHelper.loadUserCredentials();
        expect(credentials).toBeDefined();
        expect(credentials.username).toBe('goofy@supergoof.com');
        expect(credentials.password).toBe('some_password');
    });

    const testAgainstCredentialFile = (location: string, message: string) => {
        const paths = newSettingsPaths(location);
        const mqttSettingsHelper = new MqttCredentialsHelper(paths);
        expect(() => {
            mqttSettingsHelper.loadUserCredentials();
        }).toThrowError(new Error(message));
    }

    it('If the credential file is not found an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/credentials_fake.txt`, 'Credentials file not found');
    });

    it('If the credential file is empty an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/empty_credentials.txt`, 'Credentials not found : empty file');
    });

    it('If the credential file contains a string not in the format username:password an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/credentials_wrong_format.txt`, 'Credentials are does not respect the format "username:password"');
    });

    it('If the credential file contains an invalid username an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/credentials_invalid_username.txt`, 'Invalid username');
    });

});
