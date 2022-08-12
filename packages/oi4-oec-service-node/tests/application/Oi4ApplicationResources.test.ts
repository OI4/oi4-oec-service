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
        expect(resources.Source).not.toBeUndefined();
    });

    it('should be able to set sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
       resources.addSource(value);
       expect(resources.Source.has(oi4Id01.toString())).toBeTruthy();
       expect(resources.Source.get(oi4Id01.toString())).toEqual(value);
    });

    it('should be able to get sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.Source.set(oi4Id01.toString(), value);
        expect(resources.getSource(oi4Id01)).toEqual(value);
    });

    it('should be able to check sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        expect(resources.hasSource(oi4Id01)).toBeFalsy();
        resources.Source.set(oi4Id01.toString(), value);
        expect(resources.hasSource(oi4Id01)).toBeTruthy();
    });

    it('should be able to delete sub resource', () => {
        const value = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as OI4ApplicationResources;
        resources.Source.set(oi4Id01.toString(), value);
        expect(resources.hasSource(oi4Id01)).toBeTruthy();
        expect(resources.removeSource(oi4Id01)).toBeTruthy();
        expect(resources.removeSource(oi4Id01)).toBeFalsy();
    });

    it('should be able to get all sub resources if oi4id not specified', () => {

        const value01 = {oi4Id:oi4Id01, health: new Health(EDeviceHealth.MAINTENANCE_REQUIRED_4, 50)} as IOI4Resource;
        const value02 = {oi4Id:oi4Id02, health: new Health(EDeviceHealth.CHECK_FUNCTION_2, 75)} as IOI4Resource;
        const value03 = {oi4Id:oi4Id03, health: new Health(EDeviceHealth.NORMAL_0, 100)} as IOI4Resource;
        expect(resources.hasSource(oi4Id01)).toBeFalsy();
        expect(resources.hasSource(oi4Id02)).toBeFalsy();
        expect(resources.hasSource(oi4Id03)).toBeFalsy();
        resources.Source.set(oi4Id01.toString(), value01);
        resources.Source.set(oi4Id02.toString(), value02);
        resources.Source.set(oi4Id03.toString(), value03);
        const sources: IterableIterator<IOI4Resource> = resources.getSource() as IterableIterator<IOI4Resource>;
        expect(sources.next().value).toEqual(value01);
        expect(sources.next().value).toEqual(value02);
        expect(sources.next().value).toEqual(value03);
    });

    it('If oi4Id not valid then an empty list is returned', () => {
        expect(resources.getLicense(resources.oi4Id)).toStrictEqual([]);
    });

    it('If oi4Id undefined all licenses are returned', () => {
        console.log('Wait for it...');
        const license = resources.getLicense(undefined);
        expect(license.length).toBe(0);
    });

    it('If oi4Id has a value but licenseId is undefined all licenses are returned', () => {
        expect(resources.getLicense(new Oi4Identifier('a','b', 'c','d')).length).toBe(0);
    });

    it('should filter publicationList', ()=> {
        const publicationList = new PublicationList();
        publicationList.resource = Resource.DATA;
        publicationList.Source = resources.oi4Id;
        publicationList.Filter = 'oee';
        publicationList.Mode = PublicationListMode.APPLICATION_SOURCE_FILTER_8;
        publicationList.Config = PublicationListConfig.MODE_AND_INTERVAL_3;
        resources.publicationList.push(publicationList);

        expect(resources.getPublicationList()).toContain(publicationList);
        expect(resources.getPublicationList(Oi4Identifier.fromString('unknown.com/1/2/3'))).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.EVENT)).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.DATA, 'wrong')).toEqual([]);
        expect(resources.getPublicationList(resources.oi4Id, Resource.DATA, 'oee')).toContain(publicationList);
    });

});
