import {EOPCUABuiltInType} from './EOPCUA';

export interface IOPCUABuilderProps {
    unit: string;
    description: string;
    type: EOPCUABuiltInType;
    min: number;
    max: number;
}
