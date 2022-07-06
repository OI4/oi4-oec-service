import {OI4ApplicationResources} from '../../src';
import {MockedIApplicationResourceFactory} from '../Test-utils/Factories/MockedIApplicationResourceFactory';
import {IMasterAssetModel} from '@oi4/oi4-oec-service-opcua-model';
import {EDeviceHealth, Health, IOI4Resource} from '@oi4/oi4-oec-service-model';
import fs = require('fs');

describe('Test Oi4ApplicationResources', () => {

    const mam: IMasterAssetModel = MockedIApplicationResourceFactory.getMockedIApplicationResourceInstance().mam;
    let resources: OI4ApplicationResources;

    beforeEach(() => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(JSON.stringify(mam)));
        resources = new OI4ApplicationResources();
    });

    it('should initializes sub resource class field', () => {
        expect(resources.subResources).not.toBeUndefined();
    });

    it('should be able to set sub resource', () => {
        const oi4Id = 'registry.com/1';
        const value = {oi4Id:oi4Id, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
       resources.setSubResource(oi4Id, value);
       expect(resources.subResources.has(oi4Id)).toBeTruthy();
       expect(resources.subResources.get(oi4Id)).toEqual(value);
    });

    it('should be able to get sub resource', () => {
        const oi4Id = 'registry.com/1';
        const value = {oi4Id:oi4Id, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.subResources.set(oi4Id, value);
        expect(resources.getSubResource(oi4Id)).toEqual(value);
    });

    it('should be able to check sub resource', () => {
        const oi4Id = 'registry.com/1';
        const value = {oi4Id:oi4Id, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        expect(resources.hasSubResource(oi4Id)).toBeFalsy();
        resources.subResources.set(oi4Id, value);
        expect(resources.hasSubResource(oi4Id)).toBeTruthy();
    });

    it('should be able to delete sub resource', () => {
        const oi4Id = 'registry.com/1';
        const value = {oi4Id:oi4Id, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.subResources.set(oi4Id, value);
        expect(resources.hasSubResource(oi4Id)).toBeTruthy();
        expect(resources.deleteSubResource(oi4Id)).toBeTruthy();
        expect(resources.deleteSubResource(oi4Id)).toBeFalsy();
    });

    it('should be able to get all sub resources if oi4id not specified', () => {
        const oi4Id01 = 'registry.com/1';
        const oi4Id02 = 'registry.com/2';
        const oi4Id03 = 'registry.com/3';
        const value01 = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as IOI4Resource;
        const value02 = {oi4Id:oi4Id02, health: new Health(EDeviceHealth.CHECK_FUNCTION_2, 75)} as IOI4Resource;
        const value03 = {oi4Id:oi4Id03, health: new Health(EDeviceHealth.NORMAL_0, 100)} as IOI4Resource;
        expect(resources.hasSubResource(oi4Id01)).toBeFalsy();
        expect(resources.hasSubResource(oi4Id02)).toBeFalsy();
        expect(resources.hasSubResource(oi4Id03)).toBeFalsy();
        resources.subResources.set(oi4Id01, value01);
        resources.subResources.set(oi4Id02, value02);
        resources.subResources.set(oi4Id03, value03);
        const subResources: IterableIterator<IOI4Resource> = resources.getSubResource() as IterableIterator<IOI4Resource>;
        expect(subResources.next().value).toEqual(value01);
        expect(subResources.next().value).toEqual(value02);
        expect(subResources.next().value).toEqual(value03);
    });

    it('If oi4Id not valid then error is thrown', () => {
        expect(() => resources.getLicense('123123123123')).toThrow('Sub resources not yet implemented');
    });

    it('If oi4Id undefined all licenses are returned', () => {
        console.log('Wait for it...');
        const license = resources.getLicense(undefined);
        expect(license).toBe(undefined);
    });

    it('If oi4Id has a value but licenseId is undefined all licenses are returned', () => {
        expect(resources.getLicense(resources.oi4Id)).toBe(undefined);
    });

});
