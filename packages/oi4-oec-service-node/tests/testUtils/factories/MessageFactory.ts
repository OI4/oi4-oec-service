import {
    DataSetClassIds,
    Methods,
    Resources,
    EOPCUAMessageType,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes,
    oi4Namespace
} from '@oi4/oi4-oec-service-model';
import {TopicInfo, TopicWrapper} from '../../../src';

export type MessageItems = {
    serviceType: ServiceTypes;
    method: Methods;
    resource: Resources;
    category: string;
    oi4Id: Oi4Identifier;
    topic: string;
    appId: Oi4Identifier;
    tag: string;
    filter: string;
    source: string;
    publisherId: string;
    resourceType: Resources;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getTopicPrefix: Function;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getDefaultTopicInfo: Function;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getDefaultTopicWrapper: Function;
}

export class MessageFactory {

    public static getDefaultMessageItems(): MessageItems {

        const serviceType: ServiceTypes = ServiceTypes.REGISTRY;
        const appId = Oi4Identifier.fromString('mymanufacturer.com/1/1/1');
        const oi4Id = Oi4Identifier.fromString('2/2/2/2');
        const method: Methods = Methods.GET;
        const resource: Resources = Resources.MAM;
        const topic = `${oi4Namespace}/${serviceType}/${appId}/${method}/${resource}`;
        const source ='2/2/2/2';
        const filter = 'oi4_pv';
        const tag = 'tag';
        const category = 'fakeCategory';
        const publisherId = `${serviceType}/${appId}`;
        const resourceType = Resources.DATA;

        const getDefaultTopicInfo = (): TopicInfo => new TopicInfo(serviceType, appId, method, resource,  Oi4Identifier.fromString(source), filter);

        const getDefaultTopicWrapper = (): TopicWrapper => {
            return {
                topicArray: topic.split('/'),
                topicInfo: getDefaultTopicInfo(),
                raw: `${oi4Namespace}/${serviceType}/${appId}/${method}/${resource}`
            }
        };

        /**
         * The topic prefix is "oi4/<serviceType>
         */
        const getTopicPrefix = (): string => {
            return `${oi4Namespace}/${serviceType}`;
        }
        return {
            serviceType,
            resource,
            category,
            oi4Id,
            topic,
            appId,
            method,
            tag,
            filter,
            source,
            publisherId,
            resourceType,
            getTopicPrefix,
            getDefaultTopicInfo,
            getDefaultTopicWrapper,
        }

    };

    public static getDefaultParsedMessage(publisherId = '', resource: Resources = Resources.MAM): IOPCUANetworkMessage {
        return {
            MessageId: 'fakeMessageId',
            MessageType: EOPCUAMessageType.uaData,
            PublisherId: publisherId,
            DataSetClassId: DataSetClassIds[resource],
            Messages: []
        }
    }

}
