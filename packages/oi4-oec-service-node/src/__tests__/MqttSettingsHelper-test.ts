import {MqttSettingsHelper} from '../Utilities/Helpers/MqttSettingsHelper';

describe('Unit test for MqttCredentialsHelper', () => {
/*
    it('Credentials should be correctly read from file', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/correct_credentials.txt');
        const credentials = mqttSettingsHelper.getUserCredentials();
        expect(credentials).toBeDefined();
        expect(credentials.username).toBe('some_username');
        expect(credentials.password).toBe('some_password');
    });
*/
    it('If the credential file is not found an error is thrown', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/credentials_fake.txt');
        try {
            mqttSettingsHelper.getUserCredentials();
            fail('An error should be thrown from the instruction above because credential file should be missing, this instruction should not be reached');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Credentials file not found');
        }
    });

    it('If the credential file is empty an error is thrown', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/empty_credentials.txt');
        try {
            mqttSettingsHelper.getUserCredentials();
            fail('An error should be thrown from the instruction above because credentials should be missing, this instruction should not be reached');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Credentials not found : empty file');
        }
    });

    it('If the credential file contains an invalid base64 string an error is thrown', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/wrong_encoded_credentials.txt');
        try {
            mqttSettingsHelper.getUserCredentials();
            fail('An error should be thrown from the instruction above because credentials are not a proper base 64 encoded string, this instruction should not be reached');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Credential file does not contain a valid base 64 string');
        }
    });

    it('If the credential file contains a string wth an invalid base64 encoded char en error is thrown', async () => {
        const mqttSettingsHelper = new MqttSettingsHelper('./src/__fixtures__/credentials_with_wrong_character.txt');
        try {
            mqttSettingsHelper.getUserCredentials();
            fail('An error should be thrown from the instruction above because credentials are not a proper base 64 encoded string, this instruction should not be reached');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);
        }
    });

});