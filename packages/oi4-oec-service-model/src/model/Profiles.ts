import {Resource} from "./Resource";

const profileFull: string [] = [
    Resource.mam,
    Resource.health,
    Resource.license,
    Resource.licenseText,
    Resource.profile,
    Resource.data,
    Resource.rtLicense,
    Resource.config,
    Resource.event,
    Resource.metadata,
    Resource.publicationList,
    Resource.subscriptionList,
    Resource.referenceDesignation
];

export const Application = {
    mandatory:  [
        Resource.mam,
        Resource.health,
        Resource.license,
        Resource.licenseText,
        Resource.publicationList,
        Resource.profile
    ],
    full: profileFull
};

export const Device = {

    mandatory: [
        Resource.mam,
        Resource.health,
        Resource.profile
    ],
    full: profileFull,
};

