import {MqttCredentialsHelper} from '../src/application/OI4ApplicationFactory';
import {ISettingsPaths} from "../src";
import path from "path";

describe('Unit test for MqttCredentialsHelper', () => {

        const getPaths = (location: string): ISettingsPaths => {
            return {
                mqttSettings: {
                    brokerConfig: '',
                    caCertificate: '',
                    privateKey: '',
                    clientCertificate: '',
                    passphrase: '',
                    credentials: location,
                },
                certificateStorage: '',
                secretStorage: '',
                applicationSpecificStorages: undefined,
            }
        };

        it('Credentials should be correctly read from file', async () => {
            const paths = getPaths(`${__dirname}/__fixtures__/secrets/correct_credentials.txt`);
            const mqttSettingsHelper = new MqttCredentialsHelper(paths);
            const credentials = mqttSettingsHelper.loadUserCredentials();
            expect(credentials).toBeDefined();
            expect(credentials.username).toBe('goofy@supergoof.com');
            expect(credentials.password).toBe('some_password');
        });

        const testAgainstCredentialFile = (location: string, message: string) => {
            const paths = getPaths(location);
            const mqttSettingsHelper = new MqttCredentialsHelper(paths);
            expect(() => {
                mqttSettingsHelper.loadUserCredentials();
            }).toThrowError(new Error(message));
        }

        it('If the credential file is not found an error is thrown', async () => {
            const file = `${__dirname}/__fixtures__/secrets/credentials_fake.txt`;
            testAgainstCredentialFile(file, `Credentials file not found at ${path.resolve(file)}`);
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

    }
)
;
