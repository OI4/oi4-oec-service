import {DataSetClassIds, ESyslogEventFilter, IContainerState} from '@oi4/oi4-oec-service-model';
import {IOPCUANetworkMessage, OPCUABuilder} from '@oi4/oi4-oec-service-opcua-model';
import {Logger} from '@oi4/oi4-oec-service-logger';
import {TopicInfo} from './Types';
import {TopicMethods, PayloadTypes} from './Enums';

export class MqttMessageProcessor {
    private readonly sendMetaData: Function;
    private readonly sendResource: Function;
    private readonly METADATA = 'metadata';
    private readonly emit: Function;
    private readonly DATA = 'data';

    private containerState: IContainerState;
    private componentLogger: Logger;

    constructor(logger: Logger, containerState: IContainerState, sendMetaData: Function, sendResource: Function, emit: Function) {
        this.componentLogger = logger;
        this.containerState = containerState;
        this.sendMetaData = sendMetaData;
        this.sendResource = sendResource;
        this.emit = emit;
    }

    /**
     * Processes the incoming mqtt message by parsing the different elements of the topic and reacting to it
     * @param topic - the incoming topic from the messagebus
     * @param message - the entire binary message from the messagebus
     */
    public processMqttMessage = async (topic: string, message: Buffer, builder: OPCUABuilder, oi4Id: string) => {
        // Convert message to JSON, TODO: if this fails, we return an Error
        let parsedMessage: IOPCUANetworkMessage;
        try {
            parsedMessage = JSON.parse(message.toString());
        } catch (e) {
            this.componentLogger.log(`Error when parsing JSON in processMqttMessage: ${e}`, ESyslogEventFilter.warning);
            return;
        }

        const schemaResult = this.getSchemaResult(builder, parsedMessage);

        //FIXME maybe this can be moved up just after the parsedMessage initialization?
        if (parsedMessage.Messages.length === 0) {
            this.componentLogger.log('Messages Array empty in message - check DataSetMessage format', ESyslogEventFilter.informational);
        }

        if(!this.areSchemaResultAndBuildValid(schemaResult, builder, topic)){
            return;
        }

        // Split the topic into its different elements
        const topicInfo: TopicInfo = this.extractTopicInfo(topic);

        // Safety-Check: DataSetClassId
        if (parsedMessage.DataSetClassId !== DataSetClassIds[topicInfo.resource]) {
            this.componentLogger.log(`Error in pre-check, dataSetClassId mismatch, got ${parsedMessage.DataSetClassId}, expected ${DataSetClassIds[topicInfo.resource]}`, ESyslogEventFilter.warning);
            return;
        }

        // The following switch/case reacts depending on the different topic elements
        // The message is directed directly at us
        if (topicInfo.appId === oi4Id) {
            switch (topicInfo.method) {
                case TopicMethods.GET: {
                    await this.executeGetActions(topic, topicInfo, parsedMessage, builder)
                    break;
                }
                case TopicMethods.PUB: {
                    break; // Only break here, because we should not react to our own publication messages
                }
                case TopicMethods.SET: {
                    await this.executeSetActions(topicInfo, parsedMessage);
                    break;
                }
                case TopicMethods.DEL: {
                    await this.executeDelActions(topicInfo);
                    break;
                }
                default: {
                    break;
                }
            }
            // External Request (External device put this on the message bus, we need this for birth messages)
        } else {
            this.componentLogger.log(`Detected Message from: ${topicInfo.appId}`)
        }
    }

    //FIXME add a return type
    private async getSchemaResult(builder: OPCUABuilder, parsedMessage: IOPCUANetworkMessage) {
        try {
            return await builder.checkOPCUAJSONValidity(parsedMessage);
        } catch (e) {
            this.componentLogger.log(`OPC UA validation failed with: ${typeof e === 'string' ? e : JSON.stringify(e)}`, ESyslogEventFilter.warning);
            return false;
        }
    }

    //FIXME add the type of schema result
    private areSchemaResultAndBuildValid(schemaResult: any, builder: OPCUABuilder, topic: string): boolean {
        if (!schemaResult) {
            this.componentLogger.log('Error in pre-check (crash-safety) schema validation, please run asset through conformity validation or increase logLevel', ESyslogEventFilter.warning);
            return false;
        }

        if (!builder.checkTopicPath(topic)) {
            this.componentLogger.log('Error in pre-check topic Path, please correct topic Path', ESyslogEventFilter.warning);
            return false;
        }

        return true;
    }

    private extractTopicInfo(topic: string): TopicInfo {
        const topicArray = topic.split('/');
        //FIXME can this be removed?
        //const topicServiceType = topicArray[1];

        const topicAppId = `${topicArray[2]}/${topicArray[3]}/${topicArray[4]}/${topicArray[5]}`;
        const topicMethod = topicArray[6];
        const topicResource = topicArray[7];
        const topicFilter = topicArray.splice(8).join('/');

        return {appId: topicAppId, method:topicMethod, resource:topicResource, filter:topicFilter};
    }

    private async executeGetActions(topic: string, topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage, builder: OPCUABuilder) {
        if (topicInfo.resource === this.DATA) {
            this.emit('getData', {topic, message: parsedMessage});
            return;
        }

        if (topicInfo.resource === this.METADATA) {
            await this.sendMetaData(topicInfo.filter);
            return;
        }

        let payloadType: string = PayloadTypes.EMPTY;
        let page = 0;
        let perPage = 0;

        if (parsedMessage.Messages.length !== 0) {
            for (const messages of parsedMessage.Messages) {
                payloadType = await builder.checkPayloadType(messages.Payload);
                if (payloadType === PayloadTypes.LOCALE) {
                    this.componentLogger.log('Detected a locale request, but we can only send en-US!', ESyslogEventFilter.informational);
                }
                if (payloadType === PayloadTypes.PAGINATION) {
                    page = messages.Payload.page;
                    perPage = messages.Payload.perPage;
                    if (page === 0 || perPage === 0) {
                        this.componentLogger.log('Pagination requested either page or perPage 0, aborting send...');
                        return;
                    }
                }
                if (payloadType === PayloadTypes.NONE) { // Not empty, locale or pagination
                    this.componentLogger.log('Message must be either empty, locale or pagination type in a /get/ request. Aboring get operation.', ESyslogEventFilter.informational);
                    return;
                }
            }
        }

        this.sendResource(topicInfo.resource, parsedMessage.MessageId, topicInfo.filter, page, perPage)
    }

    private async executeSetActions(topicInfo: TopicInfo, parsedMessage: IOPCUANetworkMessage){
        switch (topicInfo.resource) {
            case this.DATA: {
                this.setData(topicInfo.filter, parsedMessage);
                break;
            }
            default: {
                break;
            }
        }
    }

    private async executeDelActions(topicInfo: TopicInfo){
        switch (topicInfo.resource) {
            case this.DATA: {
                this.deleteData(topicInfo.filter);
                break;
            }
            default: {
                break;
            }
        }
    }

    // SET Function section ------//
    private setData(cutTopic: string, data: IOPCUANetworkMessage) {
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if (!(tagName in dataLookup)) {
            this.containerState.dataLookup[tagName] = data;
            this.componentLogger.log(`Added ${tagName} to dataLookup`);
        } else {
            this.containerState.dataLookup[tagName] = data; // No difference if we create the data or just update it with an object
            this.componentLogger.log(`${tagName} already exists in dataLookup`);
        }
    }

    // DELETE Function section
    /**
     * Legacy: TODO: This is not specified by the specification yet
     * @param cutTopic - todo
     */
    private deleteData(cutTopic: string) {
        // ONLY SPECIFIC DATA CAN BE DELETED. WILDCARD DOES NOT DELETE EVERYTHING
        const tagName = cutTopic;
        // This topicObject is also specific to the resource. The data resource will include the TagName!
        const dataLookup = this.containerState.dataLookup;
        if (tagName === '') {
            return;
        }
        if ((tagName in dataLookup)) {
            delete this.containerState.dataLookup[tagName];
            this.componentLogger.log(`Deleted ${tagName} from dataLookup`, ESyslogEventFilter.warning);
        } else {
            this.componentLogger.log(`Cannot find ${tagName} in lookup`, ESyslogEventFilter.warning);
        }
    }

}
