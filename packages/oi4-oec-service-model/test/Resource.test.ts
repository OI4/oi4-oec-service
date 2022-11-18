import {MasterAssetModel, Profile, Resources, ServiceTypes} from '../src';

describe('Unit tests for Resources', () => {

    it.each([{deviceClass: 'OI4.OTConnector', serviceType: ServiceTypes.OT_CONNECTOR},
             {deviceClass: 'OTConnector', serviceType: ServiceTypes.OT_CONNECTOR},
             {deviceClass: 'OI4.Registry', serviceType: ServiceTypes.REGISTRY},
             {deviceClass: 'Registry', serviceType: ServiceTypes.REGISTRY},
             {deviceClass: 'OI4.ITConnector', serviceType: ServiceTypes.IT_CONNECTOR},
             {deviceClass: 'ITConnector', serviceType: ServiceTypes.IT_CONNECTOR},
             {deviceClass: 'OI4.OOCConnector', serviceType: ServiceTypes.OOC_CONNECTOR},
             {deviceClass: 'OOCConnector', serviceType: ServiceTypes.OOC_CONNECTOR},
             {deviceClass: 'OI4.Utility', serviceType: ServiceTypes.UTILITY},
             {deviceClass: 'Utility', serviceType: ServiceTypes.UTILITY},
             {deviceClass: 'OI4.Persistence', serviceType: ServiceTypes.PERSISTENCE},
             {deviceClass: 'Persistence', serviceType: ServiceTypes.PERSISTENCE},
             {deviceClass: 'OI4.Aggregation', serviceType: ServiceTypes.AGGREGATION},
             {deviceClass: 'Aggregation', serviceType: ServiceTypes.AGGREGATION}])
             ('($#) deviceClass $deviceClass shall have serviceType $serviceType', (obj) => {
                const mam = new MasterAssetModel();
                mam.DeviceClass = obj.deviceClass;

                expect(mam.getServiceType()).toBe(obj.serviceType);
             });

    it('should throw exception for unknown service type', () => {
        const mam = new MasterAssetModel();
        mam.DeviceClass = 'invalid';
        expect(()=> mam.getServiceType()).toThrowError('Unknown service type: invalid');
    });

    it ('changing the profile should not affect the original resource list', ()=> {
        const resources = [Resources.MAM, Resources.HEALTH];
        const profile = new Profile(resources);
        profile.Resources.push(Resources.EVENT);

        expect(profile.Resources).toEqual([Resources.MAM, Resources.HEALTH, Resources.EVENT]);
        expect(resources).toEqual([Resources.MAM, Resources.HEALTH]);
    })

});
