import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import fs = require('fs');
import https = require('https');
import {IContainerState} from '../../Container/index';
import {OI4Proxy} from '../index.js';
import {IOPCUANetworkMessage, IOPCUAMetaData} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {ISpecificContainerConfig, ESyslogEventFilter} from '@oi4/oi4-oec-service-model';
// @ts-ignore
import pJson from '../../../package.json';

class OI4WebProxy extends OI4Proxy {
    private readonly client: express.Application;
    private logger: Logger;

    constructor(container: IContainerState, port: number = 5799) {
        super(container);
        this.logger = new Logger(true, 'Registry-WebProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
        this.logger.log(`WebProxy: standard route: ${this.topicPreamble}`, ESyslogEventFilter.warning);

        this.client = express();
        this.client.use((_initReq, initRes, initNext) => {
            initRes.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
            initRes.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            initRes.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            initNext();
            console.log(initRes);
        });
        this.client.use(cors());
        this.client.use(bodyParser.json());
        //this.client.options('*', cors());
        // TODO should not be hard coded / fixed / better make it relative
        const certPath = process.platform === 'win32' ? 'C:/certs' : '/usr/local/share/oi4registry/cert';

        if ((process.env.USE_HTTPS) && process.env.USE_HTTPS === 'true') { // Environment variable found, so we should use HTTPS, check for key/cert
            if (fs.existsSync(`${certPath}/cert.pem`) && fs.existsSync(`${certPath}/key.pem`)) {
                this.logger.log('Key and Cert exist, using HTTPS for Express...', ESyslogEventFilter.warning);
                https.createServer(
                    {
                        key: fs.readFileSync(`${certPath}/key.pem`),
                        cert: fs.readFileSync(`${certPath}/cert.pem`),
                    },
                    this.client)
                    .listen(port, () => {
                        this.logger.log('WebProxy of Registry listening on port over HTTPS', ESyslogEventFilter.warning);
                    });
            } else {
                this.logger.log('Key and / or Cert dont exist..fallback to HTTP', ESyslogEventFilter.warning);
                this.client.listen(port, () => {
                    this.logger.log(`WebProxy of Registry listening on ${port} over HTTP`, ESyslogEventFilter.warning);
                });
            }
        } else { // No environment variable found, use HTTP
            this.logger.log('USE_HTTPS not set to "true" or not found..fallback to HTTP', ESyslogEventFilter.warning);
            this.client.listen(port, () => {
                this.logger.log(`WebProxy of Registry listening on ${port} over HTTP`, ESyslogEventFilter.warning);
            });
        }

        // Handle Get Requests
        this.client.get('/', (_indexReq, indexResp) => {
            indexResp.send(JSON.stringify(this.oi4Id));
        });

        this.client.get('/packageVersion', (_packageVersionReq, packageVersionResp) => {
            packageVersionResp.send(pJson.version);
        });

        this.client.get('/packageLicense', (_packageLicenseReq, packageLicenseResp) => {
            packageLicenseResp.send(pJson.license);
        });

        this.client.get('/brokerState', (_brokerReq, brokerResp) => {
            brokerResp.send(this.containerState.brokerState);
        });

        this.client.get('/health', (_healthReq, healthResp) => {
            healthResp.send(JSON.stringify(this.containerState.health));
        });

        this.client.get('/config', (_configReq, configResp) => {
            configResp.send(JSON.stringify(this.containerState.config));
        });

        this.client.get('/license', (_licenseReq, licenseResp) => {
            licenseResp.send(JSON.stringify(this.containerState.license));
        });

        this.client.get('/rtLicense', (_rtLicenseReq, rtLicenseResp) => {
            rtLicenseResp.send(JSON.stringify(this.containerState.rtLicense));
        });

        this.client.get('/mam', (_mamReq, mamResp) => {
            mamResp.send(JSON.stringify(this.containerState.mam));
        });

        this.client.get('/data/:tagName', (dataReq, dataResp) => {
            dataResp.send(JSON.stringify(this.containerState.dataLookup[dataReq.params.tagName]));
        });

        this.client.get('/data', (_dataReq, dataResp) => {
            dataResp.send(JSON.stringify(this.containerState.dataLookup));
        });

        this.client.get('/metadata/:tagName', (metaDataReq, metaDataResp) => {
            metaDataResp.send(JSON.stringify(this.containerState.metaDataLookup[metaDataReq.params.tagName]));
        });

        this.client.get('/metadata', (_metaDataReq, metaDataResp) => {
            metaDataResp.send(JSON.stringify(this.containerState.metaDataLookup));
        });

        // Handle Put Requests
        this.client.put('/config', (configReq, configResp) => {
            this.updateConfig(configReq.body);
            configResp.send('updatedConfig');
        });

        // Handle Post Requests
        this.client.post('/metadata/:tagName', (metaDataReq, metaDataResp) => {
            this.addMetaData(metaDataReq.params.tagName, metaDataReq.body);
            metaDataResp.send('Executed function');
        });

        this.client.post('/data/:tagName', (dataReq, dataResp) => {
            this.addData(dataReq.params.tagName, dataReq.body);
            dataResp.send(JSON.stringify({return: 'ok'}));
        });

        // Handle Delete Requests
        this.client.delete('/data/:tagName', (dataReq, dataResp) => {
            this.deleteData(dataReq.params.tagName);
            dataResp.send(JSON.stringify({return: 'ok'}));
        });
    }

    get webClient() {
        return this.client;
    }

    updateConfig(configObject: ISpecificContainerConfig) {
        this.containerState.config.registry.developmentMode.value
        this.containerState.config = configObject;
    }

    addMetaData(tagName: string, metadata: IOPCUAMetaData) {
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if (!(tagName in dataLookup) && (typeof metadata !== undefined)) {
            this.containerState.metaDataLookup[tagName] = metadata;
            this.logger.log(`Added ${tagName} to metaDataLookup via WebAPI`);
        } else {
            this.logger.log(`${tagName} either already exists or does not carry data in payload`);
        }

    }

    addData(tagName: string, data: IOPCUANetworkMessage) {
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if (!(tagName in dataLookup) && (typeof data !== undefined)) {
            this.containerState.dataLookup[tagName] = data;
            this.logger.log(`Added ${tagName} to dataLookup via WebAPI`);
        } else {
            this.logger.log(`${tagName} either already exists or does not carry data in payload`);
        }
    }

    deleteData(tagName: string) {
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if (tagName in dataLookup) {
            delete this.containerState.dataLookup[tagName];
            this.logger.log(`Deleted ${tagName} from dataLookup via WebAPI`);
        }
        this.logger.log(`${tagName} does not exist in dataLookup`);
    }
}

export {OI4WebProxy};
