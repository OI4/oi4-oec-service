import {Resource} from './Resource';

const profileFull: Resource [] = [
    Resource.MAM,
    Resource.HEALTH,
    Resource.LICENSE,
    Resource.LICENSE_TEXT,
    Resource.PROFILE,
    Resource.DATA,
    Resource.RT_LICENSE,
    Resource.CONFIG,
    Resource.EVENT,
    Resource.METADATA,
    Resource.PUBLICATION_LIST,
    Resource.SUBSCRIPTION_LIST,
    Resource.REFERENCE_DESIGNATION,
    Resource.INTERFACES
];

export const Application = {
    mandatory:  [
        Resource.MAM,
        Resource.HEALTH,
        Resource.LICENSE,
        Resource.LICENSE_TEXT,
        Resource.PUBLICATION_LIST,
        Resource.PROFILE
    ],
    full: profileFull
};

export const Device = {

    mandatory: [
        Resource.MAM,
        Resource.HEALTH,
        Resource.PROFILE,
        Resource.REFERENCE_DESIGNATION
    ],
    full: profileFull,
};
