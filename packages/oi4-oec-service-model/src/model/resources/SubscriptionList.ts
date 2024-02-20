import {OI4Payload} from '../Payload';
import {Resources} from '../Resources';

export class SubscriptionList implements OI4Payload {
    TopicPath: string;
    Interval: number;
    Config?: SubscriptionListConfig;

    resourceType(): Resources {
        return Resources.SUBSCRIPTION_LIST;
    }

    static clone(source: SubscriptionList): SubscriptionList {
        const copy = new SubscriptionList();
        Object.assign(copy, source);
        return copy;
    }
}
export enum SubscriptionListConfig {
    NONE_0 = 'NONE_0',
    CONF_1 = 'CONF_1',
}
