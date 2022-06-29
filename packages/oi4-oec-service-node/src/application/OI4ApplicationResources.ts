import {ConfigParser} from '../Utilities/ConfigParser/ConfigParser';
import {
    IContainerConfig,
    Health,
    RTLicense,
    ISubscriptionListObject,
    IPublicationListObject,
    Application,
    getResource,
    IOI4ApplicationResources,
    IContainerProfile,
    License,
} from '@oi4/oi4-oec-service-model';

import {
    IOPCUANetworkMessage,
    IOPCUAMetaData,
    IMasterAssetModel,
    IOPCUADataSetMetaData
} from '@oi4/oi4-oec-service-opcua-model';
import os from 'os';
import {EOPCUALocale} from '@oi4/oi4-oec-service-opcua-model';
import {EDeviceHealth, EPublicationListConfig, ESubscriptionListConfig} from '@oi4/oi4-oec-service-model';
import {existsSync, readFileSync} from 'fs';
import {ConfigFiles, MAMPathSettings} from '../Config/MAMPathSettings';

/**
 * class that initializes the container state
 * Initializes the mam settings by a json file and build oi4id and Serialnumbers
 * */
class OI4ApplicationResources extends ConfigParser implements IOI4ApplicationResources {
    public oi4Id: string; // TODO: doubling? Not needed here
    private readonly _profile: IContainerProfile;
    private readonly _mam: IMasterAssetModel;
    private _health: Health;
    private _brokerState: boolean;
    private _license: License[];
    private _licenseText: Record<string, string>;
    private _rtLicense: RTLicense;
    private _publicationList: IPublicationListObject[];
    private _subscriptionList: ISubscriptionListObject[];

    /**
     * constructor that initializes the mam settings by retrieving the mam.json out of /etc/oi4/config/mam.json
     * */
    constructor(mamFile: string = `${MAMPathSettings.CONFIG_DIRECTORY}${ConfigFiles.mam}`) {
        super();

        this._mam = OI4ApplicationResources.extractMamFile(mamFile); // Import MAM from JSON

        if (this.mam === undefined) {
            throw Error('MAM File not found');
        }

        this.mam.Description.locale = EOPCUALocale.enUS; // Fill in container-specific values
        this.mam.SerialNumber = os.hostname();
        this.mam.ProductInstanceUri = `${this.mam.ManufacturerUri}/${encodeURIComponent(this.mam.Model.text)}/${encodeURIComponent(this.mam.ProductCode)}/${encodeURIComponent(this.mam.SerialNumber)}`;

        this.oi4Id = this.mam.ProductInstanceUri;

        this.brokerState = false;

        this._profile = {
            resource: [
                'health',
                'license',
                'rtLicense',
                'config',
                'mam',
                'profile',
                'licenseText',
                'publicationList',
                'subscriptionList',
                'event',
            ],
        };

        this.health = new Health(EDeviceHealth.NORMAL_0, 100);

        this.license = [new License('', [])];

        this.licenseText = {};
        this.addLicenseText('MIT', `(The MIT License)
    Copyright (c) 2009-2014 TJ Holowaychuk <tj@vision-media.ca>
    Copyright (c) 2013-2014 Roman Shtylman <shtylman+expressjs@gmail.com>
    Copyright (c) 2014-2015 Douglas Christopher Wilson <doug@somethingdoug.com>

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    'Software'), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`);

        this.addLicenseText('BSD-2-Clause', `(BSD 2-Clause License)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`);

        this.rtLicense = new RTLicense();

        this.dataLookup = {};
        this.metaDataLookup = {};

        this.publicationList = []

        this.subscriptionList = []

        // Fill both pubList and subList
        for (const resources of this.profile.resource) {
            let resInterval = 0;
            if (resources === 'health') {
                resInterval = 60000;
            } else {
                resInterval = 0;
            }
            this.addPublication({
                resource: resources,
                tag: this.oi4Id,
                DataSetWriterId: 0,
                oi4Identifier: this.oi4Id,
                interval: resInterval,
                config: EPublicationListConfig.NONE_0,
            });

            this.addSubscription({
                topicPath: `oi4/${this.mam.DeviceClass}/${this.oi4Id}/get/${resources}/${this.oi4Id}`,
                interval: 0,
                config: ESubscriptionListConfig.NONE_0,
            });
        }

    }

    dataLookup: Record<string, IOPCUANetworkMessage>;
    metaDataLookup: Record<string, IOPCUADataSetMetaData>;

    private static extractMamFile(path: string): IMasterAssetModel {
        if (existsSync(path)) {
            return JSON.parse(readFileSync(path).toString());
        }
        return undefined;
    }

    // Property accessor section
    get brokerState() {
        return this._brokerState;
    }

    set brokerState(brokerState: boolean) {
        this._brokerState = brokerState;
    }

    // Resource accesor section
    // --- HEALTH ---

    get health() {
        return this._health;
    }

    set health(health: Health) {
        if (health.healthScore >= 100 && health.healthScore <= 0) throw new RangeError('healthState out of range');
        this._health = health;
        this.emit('resourceChanged', 'health');
    }

    setHealthState(healthState: number) {
        if (healthState >= 100 && healthState <= 0) throw new RangeError('healthState out of range');
        this._health = new Health(this._health.health, healthState)
        this.emit('resourceChanged', 'health');
    }

    setHealth(health: EDeviceHealth) {
        this._health = new Health(health, this._health.healthScore);
        this.emit('resourceChanged', 'health');
    }

    // --- MAM ---

    get mam(): IMasterAssetModel {
        return this._mam;
    }

    // --- Profile ---
    get profile(): IContainerProfile {
        return this._profile;
    }

    addProfile(entry: string): void {
        if (!(Application.full.includes(getResource(entry)))) console.log('Attention! Adding non-conform profile entry, proceed at own risk');
        this.profile.resource.push(entry);
        this.emit('resourceChanged', 'profile');
    }

    // --- License ---

    get license(): License[] {
        return this._license;
    }

    private set license(license) {
        this._license = license
    }

    // --- LicenseText ---
    get licenseText(): Record<string, string> {
        return this._licenseText;
    }

    private set licenseText(licenseText) {
        this._licenseText = licenseText;
    }

    // TODO: Add dynamic ENUM containing all spdx licenseIds
    addLicenseText(licenseName: string, licenseText: string) {
        this.licenseText[licenseName] = licenseText;
        this.emit('resourceChanged', 'licenseText');
    }

    // --- rtLicense ---
    get rtLicense(): RTLicense {
        return this._rtLicense;
    }

    private set rtLicense(rtLicense) {
        this._rtLicense = rtLicense;
    }

    // --- publicationList ---
    get publicationList(): IPublicationListObject[] {
        return this._publicationList;
    }

    private set publicationList(publicationList) {
        this._publicationList = publicationList;
    }

    addPublication(publicationObj: IPublicationListObject): void {
        this.publicationList.push(publicationObj);
        this.emit('resourceChanged', 'publicationList');
    }

    removePublicationByTag(tag: string): void {
        this.publicationList = this.publicationList.filter(value => value.tag !== tag);
        this.emit('resourceChanged', 'publicationList');
    }

    // --- subscriptionList ---
    get subscriptionList(): ISubscriptionListObject[] {
        return this._subscriptionList;
    }

    private set subscriptionList(subscriptionList) {
        this._subscriptionList = subscriptionList;
    }

    addSubscription(subscriptionObj: ISubscriptionListObject): void {
        this.subscriptionList.push(subscriptionObj);
        this.emit('resourceChanged', 'subscriptionList');
    }

    removeSubscriptionByTopic(topic: string): void {
        this.subscriptionList = this.subscriptionList.filter(value => value.topicPath !== topic);
        this.emit('resourceChanged', 'subscriptionList');
    }

    /**
     * Add a DataSet to the container, so that it can be sent externally via an application
     * @param key - the key under which the dataset will be saved as (data / metadata)
     * @param data - the completely built OPCUA Data message
     * @param metadata - the completely build OPCUA Metadata message (optional)
     */
    public addDataSet(key: string, data: IOPCUANetworkMessage, metadata?: IOPCUAMetaData) {
        this.dataLookup[key] = data;
        if (metadata) {
            this.metaDataLookup[key] = metadata;
        }
    }
}

export {OI4ApplicationResources, IContainerConfig, RTLicense};
