import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import fs = require('fs');
import os = require('os');
import https = require('https');
import { IContainerState, IContainerConfig } from '../../Container/index';
import { OI4Proxy } from '../index.js';
import { IOPCUANetworkMessage, IOPCUAMetaData } from '../../Models/IOPCUA';
import { Logger } from '../../Utilities/Logger';
import { ISpecificContainerConfig } from '../../Config/IContainerConfig';
import { ESyslogEventFilter } from '../../Enums/EContainer';

class OI4WebProxy extends OI4Proxy {
  private client: express.Application;
  private logger: Logger;
  constructor(container: IContainerState, port: number = 5799) {
    super(container);
    this.logger = new Logger(true, 'Registry-WebProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
    this.logger.log(`WebProxy: Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.warning);

    this.client = express();
    this.client.use((initReq, initRes, initNext) => {
      initRes.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
      initRes.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      initRes.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      initNext();
    });
    this.client.use(cors());
    this.client.use(bodyParser.json());
    //this.client.options('*', cors());
    let certpath = '';
    if (process.platform === 'win32') {
      certpath = 'C:/certs';
    } else {
      certpath = '/usr/local/share/oi4registry/cert';
    }
    if ((process.env.USE_HTTPS) && process.env.USE_HTTPS === 'true') { // Environment variable found, so we should use HTTPS, check for key/cert
      if (fs.existsSync(`${certpath}/cert.pem`) && fs.existsSync(`${certpath}/key.pem`)) {
        this.logger.log('Key and Cert exist, using HTTPS for Express...', ESyslogEventFilter.warning);
        https.createServer(
          {
            key: fs.readFileSync(`${certpath}/key.pem`),
            cert: fs.readFileSync(`${certpath}/cert.pem`),
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
    this.client.get('/', (indexReq, indexResp) => {
      indexResp.send(JSON.stringify(this.oi4Id));
    });

    this.client.get('/containerInfo', (contInfoReq, contInfoResp) => {
      contInfoResp.send(JSON.stringify({
        name: this.containerState.mam.Model.text,
        version: this.containerState.mam.SoftwareRevision,
        description: this.containerState.mam.Description.text,
        dependencies: ["none"],
        vendor: "Hilscher Gesellschaft f\u00fcr Systemautomation mbH",
        licenses: ["HILSCHER netIOT Source Code LICENSE AGREEMENT"],
        disclaimer: "see https://www.netiot.com/fileadmin/user_upload/netIOT/en/pdf/Hilscher_Source_Code_License.pdf"
      }));
    });

    this.client.get('/mqttSettings', (mqttSettingsReq, mqttSettingsResp) => {
      mqttSettingsResp.send(JSON.stringify({
        brokerUrl: process.env.OI4_EDGE_MQTT_BROKER_ADDRESS,
        brokerPort: process.env.OI4_EDGE_MQTT_SECURE_PORT,
        userName: process.env.OI4_EDGE_MQTT_USERNAME,
        password: process.env.OI4_EDGE_MQTT_PASSWORD,
      }));
    });

    this.client.get('/brokerState', (brokerReq, brokerResp) => {
      brokerResp.send(this.containerState.brokerState);
    });

    this.client.get('/health', (healthReq, healthResp) => {
      healthResp.send(JSON.stringify(this.containerState.health));
    });

    this.client.get('/config', (configReq, configResp) => {
      configResp.send(JSON.stringify(this.containerState.config));
    });

    this.client.get('/license', (licenseReq, licenseResp) => {
      licenseResp.send(JSON.stringify(this.containerState.license));
    });

    this.client.get('/rtLicense', (rtLicenseReq, rtLicenseResp) => {
      rtLicenseResp.send(JSON.stringify(this.containerState.rtLicense));
    });

    this.client.get('/mam', (mamReq, mamResp) => {
      mamResp.send(JSON.stringify(this.containerState.mam));
    });

    this.client.get('/data/:tagName', (dataReq, dataResp) => {
      dataResp.send(JSON.stringify(this.containerState.dataLookup[dataReq.params.tagName]));
    });

    this.client.get('/data', (dataReq, dataResp) => {
      dataResp.send(JSON.stringify(this.containerState.dataLookup));
    });

    this.client.get('/metadata/:tagName', (metaDataReq, metaDataResp) => {
      metaDataResp.send(JSON.stringify(this.containerState.metaDataLookup[metaDataReq.params.tagName]));
    });

    this.client.get('/metadata', (metaDataReq, metaDataResp) => {
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
      dataResp.send(JSON.stringify({ return: 'ok' }));
    });

    // Handle Delete Requests
    this.client.delete('/data/:tagName', (dataReq, dataResp) => {
      this.deleteData(dataReq.params.tagName);
      dataResp.send(JSON.stringify({ return: 'ok' }));
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

export { OI4WebProxy };
