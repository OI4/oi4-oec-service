import {OI4ApplicationResources, DEFAULT_MAM_FILE, ISettingsPaths} from '@oi4/oi4-oec-service-node';
import fs from 'fs';
import {Asset} from './AssetModel';
import {initializeLogger, LOGGER} from '@oi4/oi4-oec-service-logger';
import {OI4Resource} from '@oi4/oi4-oec-service-node/dist/application/OI4Resource';
import {ESyslogEventFilter} from '@oi4/oi4-oec-service-model';
import {getServiceType} from '@oi4/oi4-oec-service-opcua-model';

const getMamFileLocation = (isLocal: boolean) => isLocal ? './docker_configs/config/mam.json' : DEFAULT_MAM_FILE;

export class ServiceDemoOI4ApplicationResources extends OI4ApplicationResources {

    readonly assets: Asset[];

    constructor(isLocal: boolean, paths: ISettingsPaths) {
        super(getMamFileLocation(isLocal));

        this.initializeLogger();

        const assetFolder = `${paths.applicationSpecificStorages.configuration}/assets`;
        if (!fs.existsSync(assetFolder)) {
            throw new Error(`Asset folder ${assetFolder} does not exist`);
        }

        const files = fs.readdirSync(assetFolder);
        // files object contains all files names
        // log them on console
        this.assets = files.map(file => {
            try {
                return Asset.clone(JSON.parse(fs.readFileSync(`${assetFolder}/${file}`, 'utf-8')) as Asset);
            } catch (error) {
                LOGGER.log(`File ${file} is not a valid asset file and is skipped`);
                return undefined;
            }
        }).filter(asset => asset !== undefined);

        this.assets.map(asset => {
            const masterAssetModel = asset.toMasterAssetModel();
            this.addSubResource(new OI4Resource(masterAssetModel));
        });
    }

    initializeLogger(): void {
        if(LOGGER === undefined) {
            const publishingLevel: ESyslogEventFilter = process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter | ESyslogEventFilter.warning;
            const logLevel = process.env.OI4_EDGE_LOG_LEVEL ? process.env.OI4_EDGE_LOG_LEVEL as ESyslogEventFilter : publishingLevel;
            initializeLogger(true, undefined, logLevel, publishingLevel, this.oi4Id, getServiceType(this.mam.DeviceClass));
        }
    }
}
