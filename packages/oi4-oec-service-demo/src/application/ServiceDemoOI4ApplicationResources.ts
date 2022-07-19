import {OI4ApplicationResources, DEFAULT_MAM_FILE, ISettingsPaths} from '@oi4/oi4-oec-service-node';
import fs from 'fs';
import {Asset} from "./AssetModel";
import {LOGGER} from '@oi4/oi4-oec-service-logger';
import {OI4Resource} from '@oi4/oi4-oec-service-node/dist/application/OI4Resource';

const getMamFileLocation = (isLocal: boolean) => isLocal ? '../docker_configs/config/mam.json' : DEFAULT_MAM_FILE;

export class ServiceDemoOI4ApplicationResources extends OI4ApplicationResources {

    // private readonly paths: ISettingsPaths;
    private assets: Asset[];

    constructor(isLocal: boolean, paths: ISettingsPaths) {
        super(getMamFileLocation(isLocal));
        // this.paths = paths;

        const assetFolder = `${paths.applicationSpecificStorages.configuration}/assets`;
        if (!fs.existsSync(assetFolder)) {
            throw new Error(`Asset folder ${assetFolder} does not exist`);
        }

        const files = fs.readdirSync(assetFolder);
        // files object contains all files names
        // log them on console
        this.assets = files.map(file => {
            try {
                return Asset.clone(JSON.parse(fs.readFileSync(file, 'utf-8')) as Asset);
            } catch (error) {
                LOGGER.log(`File ${file} is not a valid asset file and is skipped`);
                return undefined;
            }
        }).filter(asset => asset !== undefined);

        console.log(this.assets.length);
        this.assets.map(asset => {
            const masterAssetModel = asset.toMasterAssetModel();
           this.setSubResource(new OI4Resource(masterAssetModel));
        });
    }
}
