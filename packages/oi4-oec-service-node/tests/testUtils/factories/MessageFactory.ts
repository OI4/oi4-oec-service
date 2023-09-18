import {
    DataSetClassIds,
    Methods,
    Resources,
    EOPCUAMessageType,
    IOPCUANetworkMessage,
    Oi4Identifier,
    ServiceTypes
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
    licenseId: string;
    source: string;
    publisherId: string;
    getTopicPrefix: Function;
    getDefaultTopicInfo: Function;
    getDefaultTopicWrapper: Function;
}

export class MessageFactory {

    public static getDefaultMessageItems(): MessageItems {

        const serviceType: ServiceTypes = ServiceTypes.REGISTRY;
        const appId = Oi4Identifier.fromString('mymanufacturer.com/1/1/1');
        const oi4Id = Oi4Identifier.fromString('2/2/2/2');
        const method: Methods = Methods.GET;
        const resource: Resources = Resources.MAM;
        const topic = `oi4/${serviceType}/${appId}/${method}/${resource}`;
        const source ='2/2/2/fakeSource';
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
                source:  Oi4Identifier.fromString(source)
            }
        };

        const getDefaultTopicWrapper = (): TopicWrapper => {
            return {
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
            source,
            publisherId,
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
