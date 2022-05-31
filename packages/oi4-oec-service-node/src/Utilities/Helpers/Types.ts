export type Credentials = {
    username: string;
    password: string;
}

export type ValidatedCredentials = {
    areInvalid: boolean;
    error: Error;
}