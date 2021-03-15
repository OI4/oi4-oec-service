import mqtt = require('async-mqtt'); /*tslint:disable-line*/
import { IClientOptions } from 'async-mqtt';
import { IContainerState, IContainerConfig } from '../../Container/index';
import { IOPCUANetworkMessage, IMasterAssetModel, IOPCUAPayload } from '../../Models/IOPCUA.js';
import { OI4Proxy } from '../index';
import { hasKey } from '../../Utilities/index';
import { Logger } from '../../Utilities/Logger/index';
import { EDeviceHealth, IDataSetClassIds, ESubscriptionListConfig, ESyslogEventFilter, CDataSetWriterIdLookup } from '../../Models/IContainer';

// DSCIds
import dataSetClassIds = require('../../Config/Constants/dataSetClassIds.json'); /*tslint:disable-line*/
import { ISpecificContainerConfig } from '../../Config/IContainerConfig';
const dscids: IDataSetClassIds = <IDataSetClassIds>dataSetClassIds;

class OI4MessageBusProxy extends OI4Proxy {
  private client: mqtt.AsyncClient;
  private logger: Logger;
  constructor(container: IContainerState) {
    super(container);

    // Add Server Object depending on configuration
    const serverObj = {
      host: process.env.OI4_EDGE_MQTT_BROKER_ADDRESS as string,
      port: parseInt(process.env.OI4_EDGE_MQTT_SECURE_PORT as string, 10),
    };
    console.log(`MQTT: Trying to connect with ${serverObj.host}:${serverObj.port}`);

    // Create dummy TLS object, that is certain to be rejected!
    // serverObj = {
    //   host: environment.broker.ip,
    //   port: 8883,
    //   key: 'dummykey',
    //   cert: 'dummycert',
    //   rejectUnauthorized: true,
    //   ca: 'dummyca',
    //   protocol: 'mqtts',
    // };
    // Initialize MQTT Options
    const mqttOpts: IClientOptions = {
      clientId: `MessageBus${process.env.OI4_EDGE_APPLICATION_INSTANCE_NAME as string}`,
      servers: [serverObj],
      will: {
        topic: `oi4/${this.serviceType}/${this.oi4Id}/pub/health/${this.oi4Id}`,
        payload: JSON.stringify(this.builder.buildOPCUANetworkMessage([{ payload: {
          health: EDeviceHealth.FAILURE_1,
          healthState: 0,
        }, dswid: CDataSetWriterIdLookup['health']}], new Date(), dscids.health)), /*tslint:disable-line*/
        qos: 0,
        retain: false,
      },
      username: process.env.OI4_EDGE_MQTT_USERNAME as string,
      password: process.env.OI4_EDGE_MQTT_PASSWORD as string,
      protocol: 'mqtts',
      rejectUnauthorized: false,
    };

    this.client = mqtt.connect(mqttOpts);
    
    this.logger = new Logger(true, 'Registry-BusProxy', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter, this.client, this.oi4Id, this.serviceType);
    this.logger.log(`Standardroute: ${this.topicPreamble}`, ESyslogEventFilter.warning);

    this.client.on('error', async (err: Error) => {
      console.log(`Error in mqtt client: ${err}`);
    });
    this.client.on('disconnect', async () => {
      this.containerState.brokerState = false;
      console.log('Disconnected from mqtt broker');
    });
    this.client.on('reconnect', async() => {
      this.containerState.brokerState = false;
      console.log('Reconnecting to mqtt broker');
    })
    // Publish Birth Message and start listening to topics
    this.client.on('connect', async (connack: mqtt.IConnackPacket) => {
      this.logger.log('Connected successfully', ESyslogEventFilter.warning);
      this.containerState.brokerState = true;
      await this.client.publish(
        `${this.topicPreamble}/pub/mam/${this.oi4Id}`,
        JSON.stringify(this.builder.buildOPCUANetworkMessage([{ payload: this.containerState.mam, dswid: CDataSetWriterIdLookup['mam']}], new Date(), dscids.mam)),
      );
      this.logger.log(`Published Birthmessage on ${this.topicPreamble}/pub/mam/${this.oi4Id}`, ESyslogEventFilter.warning);

      // Listen to own routes
      this.ownSubscribe(`${this.topicPreamble}/get/#`);
      this.ownSubscribe(`${this.topicPreamble}/set/#`);
      this.ownSubscribe(`${this.topicPreamble}/del/#`);

      this.client.on('message', this.processMqttMessage);
      setInterval(() => { this.sendResource('health', '', this.oi4Id); }, 60000); // send our own health every 30 seconds!
      this.containerState.on('resourceChanged', this.handleResourceChanged.bind(this));
    });
  }

  private handleResourceChanged(resource: string): void {
    if (resource === 'health') {
      this.sendResource('health', '', this.oi4Id);
    }
  }

  private async ownSubscribe(topic: string) {
    this.containerState.subscriptionList.subscriptionList.push({
      topicPath: topic,
      config: ESubscriptionListConfig.NONE_0,
      interval: 0,
    });
    return await this.client.subscribe(topic);
  }

  private async ownUnsubscribe(topic: string) {
    // Remove from subscriptionList
    this.containerState.subscriptionList.subscriptionList = this.containerState.subscriptionList.subscriptionList.filter(value => value.topicPath !== topic);
    return await this.client.unsubscribe(topic);
  }

  /**
   * Processes the incoming mqtt message by parsing the different elements of the topic and reacting to it
   * @param topic - the incoming topic from the messagebus
   * @param message - the entire binary message from the messagebus
   */
  private processMqttMessage = async (topic: string, message: Buffer) => {
    // Convert message to JSON, TODO: if this fails, we return an Error
    let parsedMessage: IOPCUANetworkMessage;
    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (e) {
      this.logger.log(`Error when parsing JSON in processMqttMessage: ${e}`, ESyslogEventFilter.warning);
      return;
    }
    let schemaResult = false;
    try {
      schemaResult = await this.builder.checkOPCUAJSONValidity(parsedMessage);
    } catch (e) {
      if (typeof e === 'string') {
        this.logger.log(e, ESyslogEventFilter.warning);
      }
    }
    if (!schemaResult) {
      this.logger.log('Error in pre-check (crash-safety) schema validation, please run asset through conformity validation or increase logLevel', ESyslogEventFilter.warning);
      return;
    }

    if (!this.builder.checkTopicPath(topic)) {
      this.logger.log('Error in pre-check topic Path, please correct topic Path', ESyslogEventFilter.warning);
      return;
    }

    // Split the topic into its different elements
    const topicArray = topic.split('/');
    const topicServiceType = topicArray[1];
    const topicAppId = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
    const topicMethod = topicArray[6];
    const topicResource = topicArray[7];
    const topicFilter = topicArray.splice(8).join('/');

    // The following switch/case reacts depending on the different topic elements

    // The message is directed directly at us
    if (topicAppId === this.oi4Id) {
      switch (topicMethod) {
        case 'get': {
          if (topicResource === 'data') {
            this.emit('getData', { topic, message: parsedMessage });
            break;
          }
          if (topicResource === 'metadata') {
            await this.sendMetaData(topicFilter);
            break;
          }
          this.sendResource(topicResource, parsedMessage.MessageId, topicFilter)
          break;
        }
        case 'pub': {
          break; // Only break here, because we should not react to our own publication messages
        }
        case 'set': {
          switch (topicResource) {
            case 'data': {
              this.setData(topicFilter, parsedMessage);
              break;
            }
            case 'config': {
              await this.setConfig(parsedMessage.Messages.map((dsm => { return dsm.Payload })), topicFilter);
              break;
            }
            default: {
              this.sendError('SetError');
              break;
            }
          }
          break;
        }
        case 'del': {
          switch (topicResource) {
            case 'data': {
              this.deleteData(topicFilter);
              break;
            }
            default: {
              this.sendError('DeleteError');
              break;
            }
          }
          break;
        }
        default: {
          break;
        }
      }
      // External Request (External device put this on the message bus, we need this for birth messages)
    } else {
      this.logger.log(`Detected Message from: ${topicAppId}`)
    }
  }

  // GET SECTION ----------------//
  /**
   * Sends all available metadata of the containerState to the bus
   * @param cutTopic - the cutTopic, containing only the tag-element
   */
  async sendMetaData(cutTopic: string) {
    const tagName = cutTopic; // Remove the leading /
    if (tagName === '') { // If there is no tag specified, we should send all available metadata
      await this.client.publish(`${this.topicPreamble}/pub/metadata`, JSON.stringify(this.containerState.metaDataLookup));
      this.logger.log(`Published ALL available MetaData on ${this.topicPreamble}/pub/metadata`);
      return;
    }
    // This topicObject is also specific to the resource. The data resource will include the TagName!
    const dataLookup = this.containerState.dataLookup;
    if (tagName in dataLookup) {
      await this.client.publish(`${this.topicPreamble}/pub/metadata/${tagName}`, JSON.stringify(this.containerState.metaDataLookup[tagName]));
      this.logger.log(`Published available MetaData on ${this.topicPreamble}/pub/metadata/${tagName}`);
    }
  }

  /**
   * Sends all available data of the containerState to the bus
   * @param cutTopic - the cuttopic, containing only the tag-element
   */
  async sendData(cutTopic: string) {
    const tagName = cutTopic;
    if (tagName === '') { // If there is no tag specified, we shuld send all available data
      await this.client.publish(`${this.topicPreamble}/pub/data`, JSON.stringify(this.containerState.dataLookup));
      this.logger.log(`Published ALL available Data on ${this.topicPreamble}/pub/data`);
      return;
    }
    // This topicObject is also specific to the resource. The data resource will include the TagName!
    const dataLookup = this.containerState.dataLookup;
    if (tagName in dataLookup) {
      await this.client.publish(`${this.topicPreamble}/pub/data/${tagName}`, JSON.stringify(this.containerState.dataLookup[tagName]));
      this.logger.log(`Published available Data on ${this.topicPreamble}/pub/data/${tagName}`);
    }
  }

  /**
   * Sends the saved Resource from containerState to the message bus
   * @param resource - the resource that is to be sent to the bus (health, license etc.)
   * @param messageId - the messageId that was sent to us with the request. If it's present, we need to put it into the correlationID of our response
   * @param [filter] - the tag of the resource
   */
  async sendResource(resource: string, messageId: string, filter: string) {
    let endTag = '';
    let payload: IOPCUAPayload[] = [];

      switch(resource) {
        case 'mam':
        case 'health':
        case 'profile':
        case 'rtLicense': { // This is the default case, just send the resource if the tag is ok
          payload = [{payload: this.containerState[resource], dswid: CDataSetWriterIdLookup[resource]}];
          break;
        }
        case 'licenseText': {
          if (typeof this.containerState.licenseText[filter] === 'undefined') return; // FIXME: Hotfix
          payload = [{ payload: { licenseText: this.containerState.licenseText[filter] }, dswid: CDataSetWriterIdLookup[resource]}]; // licenseText is special...
          break;
        }
        case 'license': {
          for (const license of this.containerState['license'].licenses) {
            payload.push({
              poi: license.licenseId,
              payload: {
                components: license.components,
              },
              dswid: CDataSetWriterIdLookup[resource],
            })
          }
          break;
        }
        case 'publicationList': {
          for (const pubs of this.containerState['publicationList'].publicationList) {
            payload.push({
              poi: pubs.resource,
              payload: pubs,
              dswid: CDataSetWriterIdLookup[resource],
            })
          }
          break;
        }
        case 'subscriptionList': {
          for (const subs of this.containerState['subscriptionList'].subscriptionList) {
            payload.push({ // TODO: poi out of topicPath property
              poi: subs.topicPath.split('/')[7],
              payload: subs,
              dswid: CDataSetWriterIdLookup[resource],
            })
          }
          break;
        }
        case 'config': {
          if (filter === '') { // Send all configs out
            for (const configGroup of Object.keys(this.containerState['config'])) {
              const actualPayload: IContainerConfig = {};
              actualPayload[configGroup] = this.containerState[resource][configGroup];
              payload.push({
                poi: configGroup,
                payload: actualPayload,
                dswid: parseInt(`${CDataSetWriterIdLookup[resource]}${42}`), // TODO:
              });
            }
          } else { // Send only filtered config out
            const actualPayload: IContainerConfig = {};
            actualPayload[filter] = this.containerState['config'][filter];
            payload.push({
              poi: filter,
              payload:  actualPayload,
              dswid: parseInt('12312')
            });
          }

          break;
        }
        default: {
          this.sendError(`Unknown Resource: ${resource}`);
        }
      }

      // Don't forget the slash
      if (filter === '') {
        endTag = filter;
      } else {
        endTag = `/${filter}`;
      }

      await this.client.publish(
        `${this.topicPreamble}/pub/${resource}${endTag}`,
        JSON.stringify(this.builder.buildOPCUANetworkMessage(payload, new Date(), dscids[resource], messageId)));
      this.logger.log(`Published ${resource} on ${this.topicPreamble}/pub/${resource}${endTag}`);
  }

  /**
   * Sends an event/event with a specified level to the message bus
   * @param eventStr - The string that is to be sent as the 'event'
   * @param level - the level that is used as a <subresource> element in the event topic
   */
  async sendEvent(eventStr: string, level: string) {
    const opcUAEvent = this.builder.buildOPCUANetworkMessage([{
      number: 1,
      description: 'Registry sendEvent',
      payload: {
        logLevel: level,
        logString: eventStr,
      },
      dswid: CDataSetWriterIdLookup['event'],
    }], new Date(), dscids.event); /*tslint:disable-line*/
    await this.client.publish(`${this.topicPreamble}/pub/event/${level}/${this.oi4Id}`, JSON.stringify(opcUAEvent));
    this.logger.log(`Published event on ${this.topicPreamble}/event/${level}/${this.oi4Id}`);
  }

  // Basic Error Functions
  async sendError(error: string) {
    this.logger.log(`Error: ${error}`, ESyslogEventFilter.error);
  }

  // SET Function section ------//
  setData(cutTopic: string, data: IOPCUANetworkMessage) {
    const tagName = cutTopic;
    // This topicObject is also specific to the resource. The data resource will include the TagName!
    const dataLookup = this.containerState.dataLookup;
    if (tagName === '') {
      return;
    }
    if (!(tagName in dataLookup)) {
      this.containerState.dataLookup[tagName] = data;
      this.logger.log(`Added ${tagName} to dataLookup`);
    } else {
      this.containerState.dataLookup[tagName] = data; // No difference if we create the data or just update it with an object
      this.logger.log(`${tagName} already exists in dataLookup`);
    }
  }

  /**
   * Update the containerstate with the configObject
   * @param configObject - the object that is to be passed to the ContainerState
   */
  async setConfig(configObjectArr: ISpecificContainerConfig[], filter: string) {
    const tempConfig = JSON.parse(JSON.stringify(this.containerState.config));
    if (filter === '') { // We want to update the entire config object
      for (const configObjects of configObjectArr) {
        for (const configGroups of Object.keys(configObjects)) {
          for (const configItems of Object.keys(configObjects[configGroups])) {
          if (configItems === 'name' || configItems === 'description') continue; // We only care about the actual config content
          tempConfig[configGroups][configItems] = configObjects[configGroups][configItems]; // TODO: This is *very* optimistic, we need more safety checks here
        }
      }
      }
    } else { // We want to update for a specific filter
      for (const configObjects of configObjectArr) {
        for (const configItems of Object.keys(configObjects[filter])) {
          if (configItems === 'name' || configItems === 'description') continue; // We only care about the actual config content
          tempConfig[filter][configItems] = configObjects[filter][configItems]; // TODO: This is *very* optimistic, we need more safety checks here
        }
      }
    }
    this.containerState.config = tempConfig;
    this.logger.log('Updated config');
    await this.sendResource('config', '', filter);
  }

  // DELETE Function section
  /**
   * Legacy: TODO: This is not specified by the specification yet
   * @param cutTopic - todo
   */
  deleteData(cutTopic: string) {
    // ONLY SPECIFIC DATA CAN BE DELETED. WILDCARD DOES NOT DELETE EVERYTHING
    const tagName = cutTopic;
    // This topicObject is also specific to the resource. The data resource will include the TagName!
    const dataLookup = this.containerState.dataLookup;
    if (tagName === '') {
      return;
    }
    if ((tagName in dataLookup)) {
      delete this.containerState.dataLookup[tagName];
      this.logger.log(`Deleted ${tagName} from dataLookup`, ESyslogEventFilter.warning);
    } else {
      this.logger.log(`Cannot find ${tagName} in lookup`, ESyslogEventFilter.warning);
    }
  }

  /**
   * Makes the MQTT Client available to be used by other applications
   */
  get mqttClient() {
    return this.client;
  }
}

export { OI4MessageBusProxy };
