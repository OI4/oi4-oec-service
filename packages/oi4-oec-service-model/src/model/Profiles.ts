import {Resources} from './Resources';

const profileFull: Resources [] = [
    Resources.MAM,
    Resources.HEALTH,
    Resources.LICENSE,
    Resources.LICENSE_TEXT,
    Resources.PROFILE,
    Resources.DATA,
    Resources.RT_LICENSE,
    Resources.CONFIG,
    Resources.EVENT,
    Resources.METADATA,
    Resources.PUBLICATION_LIST,
    Resources.SUBSCRIPTION_LIST,
    Resources.REFERENCE_DESIGNATION,
    Resources.INTERFACES
];

export const Application = {
    mandatory:  [
        Resources.MAM,
        Resources.HEALTH,
        Resources.LICENSE,
        Resources.LICENSE_TEXT,
        Resources.PUBLICATION_LIST,
        Resources.PROFILE
    ],
    full: profileFull
};

export const Device = {

    mandatory: [
        Resources.MAM,
        Resources.HEALTH,
        Resources.PROFILE,
        Resources.REFERENCE_DESIGNATION
    ],
    full: profileFull,
};
