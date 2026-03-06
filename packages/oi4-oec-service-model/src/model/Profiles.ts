import {Resources} from './Resources';

const profileFull: Resources [] = [
    Resources.MAM,
    Resources.HEALTH,
    Resources.PROFILE,
    Resources.DATA,
    Resources.CONFIG,
    Resources.EVENT,
    Resources.METADATA,
    Resources.PUBLICATION_LIST,
    Resources.SUBSCRIPTION_LIST,
    Resources.REFERENCE_DESIGNATION,
];

export const profileApplication = {
    mandatory:  [
        Resources.MAM,
        Resources.HEALTH,
        Resources.PUBLICATION_LIST,
        Resources.PROFILE
    ],
    full: profileFull
};

export const profileDevice = {

    mandatory: [
        Resources.MAM,
        Resources.HEALTH,
        Resources.PROFILE,
        Resources.REFERENCE_DESIGNATION
    ],
    full: profileFull,
};
