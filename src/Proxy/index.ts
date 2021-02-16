import { IContainerState } from '../Container';
import { EventEmitter } from 'events';
import { OPCUABuilder } from '../Utilities/OPCUABuilder/index';
export class OI4Proxy extends EventEmitter {
  public oi4Id: string;
  public serviceType: string;
  public containerState: IContainerState;
  public topicPreamble: string;
  public builder: OPCUABuilder;

  constructor(containerState: IContainerState) {
    super();
    this.oi4Id = containerState.oi4Id;
    this.serviceType = containerState.mam.DeviceClass;
    this.builder = new OPCUABuilder(this.oi4Id, this.serviceType);
    this.topicPreamble = `oi4/${this.serviceType}/${this.oi4Id}`;
    this.containerState = containerState;
  }
}
