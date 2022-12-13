import { isSomething, isString } from 'ts-type-guards';

export function isSettings(value: unknown): value is Settings {
    return (
        // validate host prop
        (value as Settings).hasOwnProperty('host')
        && isString((value as Settings).host)
        && (value as Settings).host.length > 3
        // validate appAccessToken prop
        && (value as Settings).hasOwnProperty('appAccessToken')
        && isString((value as Settings).appAccessToken)
        // && (value as Settings).appAccessToken.length > 3
        // validate fetchEvery prop
        && (value as Settings).hasOwnProperty('fetchEvery')
        && isString((value as Settings).fetchEvery)
        && (value as Settings).fetchEvery.length > 2
    );
}

export type Settings = {
    host: string;
    appAccessToken: string;
    fetchEvery: string;
};