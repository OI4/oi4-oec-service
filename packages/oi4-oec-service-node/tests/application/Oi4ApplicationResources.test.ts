import {OI4ApplicationResources} from '../../src';
import {MockedIApplicationResourceFactory} from '../Test-utils/Factories/MockedIApplicationResourceFactory';
import {IMasterAssetModel, Oi4Identifier} from '@oi4/oi4-oec-service-opcua-model';
import {EDeviceHealth, Health, IOI4Resource, PublicationList, PublicationListMode, PublicationListConfig, Resource} from '@oi4/oi4-oec-service-model';
import fs = require('fs');

describe('Test Oi4ApplicationResources', () => {

    const oi4Id01 = new Oi4Identifier('registry.com','1','1','1');
    const oi4Id02 = new Oi4Identifier('registry.com','2','2','2');
    const oi4Id03 = new Oi4Identifier('registry.com','3','3','3');

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
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
       resources.addSubResource(value);
       expect(resources.subResources.has(oi4Id01.toString())).toBeTruthy();
       expect(resources.subResources.get(oi4Id01.toString())).toEqual(value);
    });

    it('should be able to get sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.subResources.set(oi4Id01.toString(), value);
        expect(resources.getSubResource(oi4Id01)).toEqual(value);
    });

    it('should be able to check sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        expect(resources.hasSubResource(oi4Id01)).toBeFalsy();
        resources.subResources.set(oi4Id01.toString(), value);
        expect(resources.hasSubResource(oi4Id01)).toBeTruthy();
    });

    it('should be able to delete sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.subResources.set(oi4Id01.toString(), value);
        expect(resources.hasSubResource(oi4Id01)).toBeTruthy();
        expect(resources.removeSubResource(oi4Id01)).toBeTruthy();
        expect(resources.removeSubResource(oi4Id01)).toBeFalsy();
    });

    it('should be able to get all sub resources if oi4id not specified', () => {

        const value01 = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as IOI4Resource;
        const value02 = {oi4Id:oi4Id02, health: new Health(EDeviceHealth.CHECK_FUNCTION_2, 75)} as IOI4Resource;
        const value03 = {oi4Id:oi4Id03, health: new Health(EDeviceHealth.NORMAL_0, 100)} as IOI4Resource;
        expect(resources.hasSubResource(oi4Id01)).toBeFalsy();
        expect(resources.hasSubResource(oi4Id02)).toBeFalsy();
        expect(resources.hasSubResource(oi4Id03)).toBeFalsy();
        resources.subResources.set(oi4Id01.toString(), value01);
        resources.subResources.set(oi4Id02.toString(), value02);
        resources.subResources.set(oi4Id03.toString(), value03);
        const subResources: IterableIterator<IOI4Resource> = resources.getSubResource() as IterableIterator<IOI4Resource>;
        expect(subResources.next().value).toEqual(value01);
        expect(subResources.next().value).toEqual(value02);
        expect(subResources.next().value).toEqual(value03);
    });

    it('If oi4Id not valid then error is thrown', () => {
        expect(() => resources.getLicense(new Oi4Identifier('12','31','23','123123'))).toThrow('Sub resources not yet implemented');
    });

    it('If oi4Id undefined all licenses are returned', () => {
        console.log('Wait for it...');
        const license = resources.getLicense(undefined);
        expect(license.length).toBe(0);
    });

    it('If oi4Id has a value but licenseId is undefined all licenses are returned', () => {
        expect(resources.getLicense(resources.oi4Id).length).toBe(0);
    });

    it('should filter publicationList', ()=> {
        const publicationList = new PublicationList();
        publicationList.resource = Resource.DATA;
        publicationList.oi4Identifier = resources.oi4Id;
        publicationList.filter = 'oee';
        publicationList.mode = PublicationListMode.APPLICATION_SUBRESOURCE_FILTER_8;
        publicationList.config = PublicationListConfig.MODE_AND_INTERVAL_3;
        resources.publicationList.push(publicationList);

        expect(resources.getPublicationList()).toContain(publicationList);
        expect(resources.getPublicationList(Oi4Identifier.fromString('unknown.com/1/2/3'))).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.EVENT)).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.DATA, 'wrong')).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.DATA, 'oee')).toContain(publicationList);
    });

});
