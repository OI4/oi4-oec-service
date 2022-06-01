import {MqttSettingsHelper} from '../Utilities/Helpers/MqttSettingsHelper';

describe('Unit test for MqttCredentialsHelper', () => {

    it('Credentials should be correctly read from file', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/correct_credentials.txt');
        const credentials = mqttSettingsHelper.loadUserCredentials();
        expect(credentials).toBeDefined();
        expect(credentials.username).toBe('goofy@supergoof.com');
        expect(credentials.password).toBe('some_password');
    });

    const testAgainstCredentialFile = (location: string, message: string) => {
        const mqttSettingsHelper = new MqttSettingsHelper(location);
        expect(() => {
            mqttSettingsHelper.loadUserCredentials();
        }).toThrowError(new Error(message));
    }

    it('If the credential file is not found an error is thrown', async () => {
        testAgainstCredentialFile('./src/__fixtures__/credentials_fake.txt', 'Credentials file not found');
    });

    it('If the credential file is empty an error is thrown', async () => {
        testAgainstCredentialFile('./src/__fixtures__/empty_credentials.txt', 'Credentials not found : empty file');
    });

    it('If the credential file contains a string not in the format username:password an error is thrown', async () => {
        testAgainstCredentialFile('./src/__fixtures__/credentials_withWrong_format_1.txt', 'Credential are does not respect the format "username:password"');
    });

});