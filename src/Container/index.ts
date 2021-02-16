import { ConfigParser } from '../Utilities/ConfigParser/index';
import {
  IContainerState,
  IContainerConfig,
  IContainerHealth,
  IContainerLicense,
  IContainerLicenseText,
  IContainerRTLicense,
  IContainerData,
  IContainerMetaData,
  EDeviceHealth,
  IContainerProfile,
  IContainerPublicationList,
  IContainerSubscriptionList,
  EPublicationListConfig,
  ESubscriptionListConfig,
  ISubscriptionListObject,
  IPublicationListObject,
} from '../Models/IContainer';

import { IOPCUAData, IOPCUAMetaData, IMasterAssetModel, EOPCUALocale } from '../Models/IOPCUAPayload';

import masterAssetModel from '../../Config/masterAssetModel.json'; /*tslint:disable-line*/

import resources from '../../Config/Constants/resources.json'; /*tslint:disable-line*/

class ContainerState extends ConfigParser implements IContainerState {
  public oi4Id: string; // TODO: doubling? Not needed here
  private _profile: IContainerProfile;
  private _mam: IMasterAssetModel;
  private _health: IContainerHealth;
  public _license: IContainerLicense;
  public _licenseText: IContainerLicenseText;
  public _rtLicense: IContainerRTLicense;

  public _publicationList: IContainerPublicationList;
  public _subscriptionList: IContainerSubscriptionList;

  public dataLookup: IContainerData;
  public metaDataLookup: IContainerMetaData;

  constructor() {
    super();

    this._mam = masterAssetModel as IMasterAssetModel; // Import MAM from JSON
    this._mam.Description.Locale = EOPCUALocale.enUS; // Fill in container-specific values
    this._mam.SerialNumber = process.env.APPLICATION_INSTANCE_NAME as string;
    this._mam.ProductInstanceUri = `${this._mam.ManufacturerUri}/${encodeURIComponent(this._mam.Model.Text)}/${encodeURIComponent(this._mam.ProductCode)}/${encodeURIComponent(this._mam.SerialNumber)}`;

    this.oi4Id = this._mam.ProductInstanceUri;

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
      ],
    };

    this._health = {
      health: EDeviceHealth.NORMAL_0,
      healthState: 100,
    };

    this._license = {
      licenses: [
        {
          licenseId: 'MIT',
          components: [
            {
              component: 'Async-Mqtt.js',
              licAuthor: [
                'Adam Rudd',
                'Octavian Ionescu',
                'Nick O\'Leary',
                'Matteo Collina',
                'Nicholas Dudfield',
                'Wouter Klijn',
                'Yohei Onishi',
                'RangerMauve',
              ],
              licAddText: 'https://www.npmjs.com/package/async-mqtt',
            },
            {
              component: 'Express.js',
              licAuthor: [
                'Andrew Kelley',
                'Ryan',
                'Rand McKinney',
                'Yiyu He',
                'Douglas Wilson',
                'fengmk2',
                'Jeremiah Senkpiel',
                'et al',
              ],
              licAddText: 'https://www.npmjs.com/package/express',
            },
            {
              component: 'chalk',
              licAuthor: [
                'sindresorhus',
                'Qix-',
                'et al',
              ],
              licAddText: 'https://www.npmjs.com/package/chalk',
            },
            {
              component: 'uuid',
              licAuthor: [
                'ctavan',
                'broofa',
                'defunctzombie',
                'solderjs',
                'benjreinhart',
                'et al',
              ],
              licAddText: 'https://www.npmjs.com/package/uuid',
            },
            {
              component: 'ajv',
              licAuthor: [
                'epoberezkin',
                'blakeembrey',
                'gajus',
                'et al',
              ],
              licAddText: 'https://www.npmjs.com/package/ajv',
            },
          ],
        },
        {
          licenseId: 'BSD-2-Clause',
          components: [
            {
              component: 'dotenv',
              licAuthor: [
                'motdotla',
                'maxbeatty',
                'jcblw',
                'jessefulton',
                'et al',
              ],
              licAddText: 'https://www.npmjs.com/package/dotenv',
            },
          ],
        },
        {
          licenseId: 'BSD-3-Clause',
          components: [
            {
              component: 'OI4-Registry',
              licAuthor: [
                'OI4-Hilscher',
                'Berti Martens',
              ],
              licAddText: 'none',
            },
          ],
        },
      ],
    };

    this._licenseText = {};
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
    this.addLicenseText('BSD-3-Clause', `(BSD 3-Clause License)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.

    3. Neither the name of the copyright holder nor the names of its
       contributors may be used to endorse or promote products derived from
       this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    `);

    this._rtLicense = {};

    this.dataLookup = {};
    this.metaDataLookup = {};

    this._publicationList = {
      publicationList: [],
    };

    this._subscriptionList = {
      subscriptionList: [],
    };

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
        DataSetWriterId: this.oi4Id,
        status: true,
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

  // Resource accesor section
  // --- HEALTH ---

  get health() {
    return this._health;
  }

  set health(health: IContainerHealth) {
    if (health.healthState >= 100 && health.healthState <= 0) throw new RangeError('healthState out of range');
    this._health = health;
    this.emit('resourceChanged', 'health');
  }

  setHealthState(healthState: number) {
    if (healthState >= 100 && healthState <= 0) throw new RangeError('healthState out of range');
    this._health.healthState = healthState;
    this.emit('resourceChanged', 'health');
  }

  setHealth(health: EDeviceHealth) {
    this._health.health = health;
    this.emit('resourceChanged', 'health');
  }

  // --- MAM ---

  get mam() {
    return this._mam;
  }

  // --- Profile ---
  get profile() {
    return this._profile;
  }

  addProfile(entry: string): void {
    if (!(resources.full.includes(entry))) console.log('Attention! Adding non-conform profile entry, proceed at own risk');
    this._profile.resource.push(entry);
    this.emit('resourceChanged', 'profile');
  }

  // --- License ---

  get license() {
    return this._license;
  }

  // --- LicenseText ---
  get licenseText() {
    return this._licenseText;
  }

  // TODO: Add dynamic ENUM containing all spdx licenseIds
  addLicenseText(licenseName: string, licenseText: string) {
    this._licenseText[licenseName] = licenseText;
    this.emit('resourceChanged', 'licenseText');
  }

  // --- rtLicense ---
  get rtLicense() {
    return this._rtLicense;
  }

  // --- publicationList ---
  get publicationList() {
    return this._publicationList;
  }

  addPublication(publicationObj: IPublicationListObject): void {
    this._publicationList.publicationList.push(publicationObj);
    this.emit('resourceChanged', 'publicationList');
  }

  removePublicationByTag(tag: string): void {
    this._publicationList.publicationList = this._publicationList.publicationList.filter(value => value.tag !== tag);
    this.emit('resourceChanged', 'publicationList');
  }

  // --- subscriptionList ---
  get subscriptionList() {
    return this._subscriptionList;
  }

  addSubscription(subscriptionObj: ISubscriptionListObject): void {
    this._subscriptionList.subscriptionList.push(subscriptionObj);
    this.emit('resourceChanged', 'subscriptionList');
  }

  removeSubscriptionByTopic(topic: string): void {
    this._subscriptionList.subscriptionList = this._subscriptionList.subscriptionList.filter(value => value.topicPath !== topic);
    this.emit('resourceChanged', 'subscriptionList');
  }

  /**
   * Add a DataSet to the container, so that it can be sent externally via an application
   * @param key - the key under which the dataset will be saved as (data / metadata)
   * @param data - the completely built OPCUA Data message
   * @param metadata - the completely build OPCUA Metadata message (optional)
   */
  public addDataSet(key: string, data: IOPCUAData, metadata?: IOPCUAMetaData) {
    this.dataLookup[key] = data;
    if (metadata) {
      this.metaDataLookup[key] = metadata;
    }
  }
}

export { ContainerState, IContainerState, IContainerConfig, IContainerRTLicense };
