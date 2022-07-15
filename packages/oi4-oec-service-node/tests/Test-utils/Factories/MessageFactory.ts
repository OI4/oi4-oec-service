import {DataSetClassIds, Resource, ServiceTypes} from '@oi4/oi4-oec-service-model';
import {TopicMethods} from '../../../src/Utilities/Helpers/Enums';
import {EOPCUAMessageType, IOPCUANetworkMessage} from '@oi4/oi4-oec-service-opcua-model';
import {TopicInfo, TopicWrapper} from '../../../dist/Utilities/Helpers/Types';

export type MessageItems = {
    serviceType: ServiceTypes;
    method: TopicMethods;
    resource: Resource;
    category: string;
    oi4Id: string;
    topic: string;
    appId: string;
    tag: string;
    filter: string;
    licenseId: string;
    subResource: string;
    publisherId: string;
    getTopicPrefix: Function;
    getDefaultTopicInfo: Function;
    getDefaultTopicWrapper: Function;
}

export class MessageFactory {

    public static getDefaultMessageItems(): MessageItems {

        const serviceType: ServiceTypes = ServiceTypes.REGISTRY;
        const appId = 'mymanufacturer.com/1/1/1';
        const oi4Id = '2/2/2/2';
        const method: TopicMethods = TopicMethods.GET;
        const resource: Resource = Resource.MAM;
        const topic = `oi4/${serviceType}/${appId}/${method}/${resource}`;
        const subResource = 'fakeSubResource';
        const licenseId = '1234';
        const filter = 'oi4_pv';
        const tag = 'tag';
        const category = 'fakeCategory';
        const publisherId = `${serviceType}/${appId}`;

        const getDefaultTopicInfo = (): TopicInfo => {
            return {
                topic: topic,
                appId: appId,
                method: method,
                resource: resource,
                oi4Id: oi4Id,
                category: category,
                serviceType: serviceType,
                tag: tag,
                filter: filter,
                licenseId: licenseId,
                subResource: subResource
            }
        };

        const getDefaultTopicWrapper = (): TopicWrapper => {
            return {
                topic: topic,
                topicArray: topic.split('/'),
                topicInfo: getDefaultTopicInfo()
            }
        };

        /**
         * The topic prefix is "oi4/<serviceType>
         */
        const getTopicPrefix = (): string => {
            return `oi4/${serviceType}`;
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
            licenseId,
            subResource,
            publisherId,
            getTopicPrefix,
            getDefaultTopicInfo,
            getDefaultTopicWrapper,
        }

    };

    public static getDefaultParsedMessage(publisherId = '', resource: Resource = Resource.MAM): IOPCUANetworkMessage {
        return {
            MessageId: 'fakeMessageId',
            MessageType: EOPCUAMessageType.uaData,
            PublisherId: publisherId,
            DataSetClassId: DataSetClassIds[resource],
            Messages: []
        }
    }

}