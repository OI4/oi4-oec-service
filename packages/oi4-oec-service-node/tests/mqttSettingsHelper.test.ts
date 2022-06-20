import {MqttCredentialsHelper} from '../src/messageBus/OI4ApplicationFactory';

describe('Unit test for MqttCredentialsHelper', () => {

    it('Credentials should be correctly read from file', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const mqttSettingsHelper = new MqttCredentialsHelper({credentials: `${__dirname}/__fixtures__/secrets/correct_credentials.txt`});
        const credentials = mqttSettingsHelper.loadUserCredentials();
        expect(credentials).toBeDefined();
        expect(credentials.username).toBe('goofy@supergoof.com');
        expect(credentials.password).toBe('some_password');
    });

    const testAgainstCredentialFile = (location: string, message: string) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const mqttSettingsHelper = new MqttCredentialsHelper({credentials: location});
        expect(() => {
            mqttSettingsHelper.loadUserCredentials();
        }).toThrowError(new Error(message));
    }

    it('If the credential file is not found an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/secrets/credentials_fake.txt`, 'Credentials file not found');
    });

    it('If the credential file is empty an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/secrets/empty_credentials.txt`, 'Empty secret');
    });

    it('If the credential file contains a string not in the format username:password an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/secrets/credentials_wrong_format.txt`, 'Credentials are does not respect the format "username:password"');
    });

    it('If the credential file contains an invalid username an error is thrown', async () => {
        testAgainstCredentialFile(`${__dirname}/__fixtures__/secrets/credentials_invalid_username.txt`, 'Invalid username');
    });

});