import {OI4ApplicationResources} from '../../src';
import {OI4ResourceEvent} from '../../src/application/OI4Resource';
import {MockedIApplicationResourceFactory} from '../testUtils/factories/MockedIApplicationResourceFactory';
import {EOPCUABaseDataType, EOPCUALocale, IMasterAssetModel, Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';
import {
    EDeviceHealth,
    Health,
    IContainerConfig,
    IContainerConfigConfigName,
    IContainerConfigGroupName,
    IOI4Resource,
    PublicationList,
    PublicationListConfig,
    PublicationListMode,
    Resources
} from '@oi4/oi4-oec-service-model';
import fs = require('fs');

describe('Test Oi4ApplicationResources', () => {

    const oi4Id01 = new Oi4Identifier('registry.com', '1', '1', '1');
    const oi4Id02 = new Oi4Identifier('registry.com', '2', '2', '2');
    const oi4Id03 = new Oi4Identifier('registry.com', '3', '3', '3');

    const mam: IMasterAssetModel = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance().mam;
    let appResources: OI4ApplicationResources;

    beforeEach(() => {
        jest.resetModules();
        jest.resetAllMocks();

        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(JSON.stringify(mam)));
        appResources = new OI4ApplicationResources();
    });

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    it('should initializes sub resource class field', () => {
        expect(appResources.sources).not.toBeUndefined();
    });

    it('should be able to set sub resource', () => {
        const value = {
            oi4Id: oi4Id01,
            health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)
        } as OI4ApplicationResources;
        appResources.addSource(value);
        expect(appResources.sources.has(oi4Id01.toString())).toBeTruthy();
        expect(appResources.sources.get(oi4Id01.toString())).toEqual(value);
    });

    it('should be able to get sub resource', () => {
        const value = {
            oi4Id: oi4Id01,
            health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)
        } as OI4ApplicationResources;
        appResources.sources.set(oi4Id01.toString(), value);
        expect(appResources.getSource(oi4Id01)).toEqual(value);
    });

    it('should be able to check sub resource', () => {
        const value = {
            oi4Id: oi4Id01,
            health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)
        } as OI4ApplicationResources;
        expect(appResources.hasSource(oi4Id01)).toBeFalsy();
        appResources.sources.set(oi4Id01.toString(), value);
        expect(appResources.hasSource(oi4Id01)).toBeTruthy();
    });

    it('should be able to delete sub resource', () => {
        const value = {
            oi4Id: oi4Id01,
            health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)
        } as OI4ApplicationResources;
        appResources.sources.set(oi4Id01.toString(), value);
        expect(appResources.hasSource(oi4Id01)).toBeTruthy();
        expect(appResources.removeSource(oi4Id01)).toBeTruthy();
        expect(appResources.removeSource(oi4Id01)).toBeFalsy();
    });

    it('should be able to get all sub appResources if oi4id not specified', () => {

        const value01 = {oi4Id: oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as IOI4Resource;
        const value02 = {oi4Id: oi4Id02, health: new Health(EDeviceHealth.CHECK_FUNCTION_2, 75)} as IOI4Resource;
        const value03 = {oi4Id: oi4Id03, health: new Health(EDeviceHealth.NORMAL_0, 100)} as IOI4Resource;
        expect(appResources.hasSource(oi4Id01)).toBeFalsy();
        expect(appResources.hasSource(oi4Id02)).toBeFalsy();
        expect(appResources.hasSource(oi4Id03)).toBeFalsy();
        appResources.sources.set(oi4Id01.toString(), value01);
        appResources.sources.set(oi4Id02.toString(), value02);
        appResources.sources.set(oi4Id03.toString(), value03);
        const sources: IterableIterator<IOI4Resource> = appResources.getSource() as IterableIterator<IOI4Resource>;
        expect(sources.next().value).toEqual(value01);
        expect(sources.next().value).toEqual(value02);
        expect(sources.next().value).toEqual(value03);
    });

    it('If oi4Id not valid then an empty list is returned', () => {
        expect(appResources.getLicense(appResources.oi4Id)).toStrictEqual([]);
    });

    it('If oi4Id undefined all licenses are returned', () => {
        const license = appResources.getLicense(undefined);
        expect(license.length).toBe(0);
    });

    it('If oi4Id has a value but licenseId is undefined all licenses are returned', () => {
        expect(appResources.getLicense(new Oi4Identifier('a', 'b', 'c', 'd')).length).toBe(0);
    });

    it('should filter publicationList', () => {
        const publicationList = new PublicationList();
        publicationList.Resource = Resources.DATA;
        publicationList.Source = appResources.oi4Id;
        publicationList.Filter = 'oee';
        publicationList.Mode = PublicationListMode.APPLICATION_SOURCE_FILTER_8;
        publicationList.Config = PublicationListConfig.MODE_AND_INTERVAL_3;
        appResources.publicationList.push(publicationList);

        expect(appResources.getPublicationList()).toContain(publicationList);
        expect(appResources.getPublicationList(Oi4Identifier.fromString('unknown.com/1/2/3'))).toEqual([]);
        expect(appResources.getPublicationList(appResources.oi4Id, Resources.EVENT)).toEqual([]);
        expect(appResources.getPublicationList(appResources.oi4Id, Resources.DATA, 'wrong')).toEqual([]);
        expect(appResources.getPublicationList(appResources.oi4Id, Resources.DATA, 'oee')).toContain(publicationList);
    });


    function createConfig(): IContainerConfig {
        const containerConfig: IContainerConfig = {
            'group-a': {
                Name: {Locale: EOPCUALocale.enUS, Text: 'group-a'},
                'config_a': {
                    Name: {Locale: EOPCUALocale.enUS, Text: 'config_a'},
                    Value: '2000',
                    Type: EOPCUABaseDataType.Number,
                    Validation: {
                        Min: 0,
                        Max: 2000
                    }
                }
            },
            'context': {
                Name: {Locale: EOPCUALocale.enUS, Text: 'filter 1'}
            }
        };

        return containerConfig;
    }

    function createResourceWithConfig(oi4Id: Oi4Identifier): IOI4Resource {
        return {
            oi4Id: oi4Id,
            config: createConfig(),
            profile: undefined,
            mam: undefined,
            health: undefined,
            license: [],
            licenseText: undefined,
            rtLicense: undefined,
            publicationList: [],
            subscriptionList: []
        };
    }

    it('setConfig updates main configuration', () => {
        appResources.config = createConfig();
        const setConfig = createConfig();
        ((setConfig['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value = '1000';

        let receivedOi4Id: Oi4Identifier = undefined;
        let receivedResource: Resources = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_CHANGED, (oi4Id: Oi4Identifier, res: Resources) => {
            receivedOi4Id = oi4Id;
            receivedResource = res;
        })

        const result = appResources.setConfig(appResources.oi4Id, 'filter%201', setConfig);

        expect(result).toBeTruthy();
        expect(((appResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('1000');
        expect(receivedOi4Id).toStrictEqual(appResources.oi4Id);
        expect(receivedResource).toBe(Resources.CONFIG);
    });

    it('setConfig updates source configuration', () => {
        const oi4Identifier = new Oi4Identifier('vendor.com', 'a', 'b', 'c');
        const source = createResourceWithConfig(oi4Identifier);
        appResources.addSource(source);

        const setConfig = createConfig();
        ((setConfig['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value = '1000';

        let receivedOi4Id: Oi4Identifier = undefined;
        let receivedResource: Resources = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_CHANGED, (oi4Id: Oi4Identifier, res: Resources) => {
            receivedOi4Id = oi4Id;
            receivedResource = res;
        })

        const result = appResources.setConfig(oi4Identifier, 'filter%201', setConfig);
        const sourceResources = appResources.sources.get(oi4Identifier.toString());
        expect(result).toBeTruthy();
        expect(((sourceResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('1000');
        expect(receivedOi4Id).toStrictEqual(oi4Identifier);
        expect(receivedResource).toBe(Resources.CONFIG);
    });

    it('setConfig updates nothing if filter is wrong', () => {
        appResources.config = createConfig();
        const setConfig = createConfig();
        ((setConfig['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value = '1000';

        let receivedOi4Id: Oi4Identifier = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_CHANGED, (oi4Id: Oi4Identifier) => {
            receivedOi4Id = oi4Id;
        })

        const result = appResources.setConfig(appResources.oi4Id, 'WRONG_FILTER', setConfig);

        expect(result).toBeFalsy();
        expect(((appResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('2000');
        expect(receivedOi4Id).toBe(undefined);
    });

    it('setConfig updates nothing if new setting is unknown ', () => {
        appResources.config = createConfig();
        const setConfig: IContainerConfig = {
            'group-xyz': {
                Name: {Locale: EOPCUALocale.enUS, Text: 'group-xyz'},
                'config_a': {
                    Name: {Locale: EOPCUALocale.enUS, Text: 'config_a'},
                    Value: '1000',
                    Type: EOPCUABaseDataType.Number
                }
            }
        };

        let receivedOi4Id: Oi4Identifier = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_CHANGED, (oi4Id: Oi4Identifier) => {
            receivedOi4Id = oi4Id;
        })

        const result = appResources.setConfig(appResources.oi4Id, 'filter%201', setConfig);

        expect(result).toBeFalsy();
        expect(((appResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('2000');
        expect(receivedOi4Id).toBe(undefined);
    });

    it('setConfig updates nothing if new value is out of range', () => {
        appResources.config = createConfig();
        const setConfig = createConfig();
        ((setConfig['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value = '56789';

        let receivedOi4Id: Oi4Identifier = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_CHANGED, (oi4Id: Oi4Identifier) => {
            receivedOi4Id = oi4Id;
        })

        const result = appResources.setConfig(appResources.oi4Id, 'filter%201', setConfig);

        expect(result).toBeFalsy();
        expect(((appResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('2000');
        expect(receivedOi4Id).toBe(undefined);
    });


    it('setConfig sets main configuration', () => {
        const setConfig = createConfig();

        let receivedOi4Id: Oi4Identifier = undefined;
        let receivedResource: Resources = undefined;
        appResources.once(OI4ResourceEvent.RESOURCE_ADDED, (oi4Id: Oi4Identifier, res: Resources) => {
            receivedOi4Id = oi4Id;
            receivedResource = res;
        })

        const result = appResources.setConfig(appResources.oi4Id, 'filter%201', setConfig);

        expect(result).toBeTruthy();
        expect(((appResources.config['group-a'] as IContainerConfigGroupName)['config_a'] as IContainerConfigConfigName).Value).toBe('2000');
        expect(receivedOi4Id).toStrictEqual(appResources.oi4Id);
        expect(receivedResource).toBe(Resources.CONFIG);
    });

});
