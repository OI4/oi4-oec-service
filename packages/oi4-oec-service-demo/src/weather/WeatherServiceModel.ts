export interface WeatherServiceResponse {
    coord: Coordinates;
    weather: Weather[];
    base: string; // Internal parameter
    main: MainWeather;
    visibility: number; // Visibility, meter. The maximum value of the visibility is 10km
    wind: Wind;
    clouds: Clouds;
    rain: Rain;
    snow: Snow;
    sys: System;
    timezone: number; // Shift in seconds from UTC
    id: string; // City ID
    name: string; // City name
    cod: number; // Internal parameter
}

export interface Coordinates {
    lon: number; // City geolocation, longitude
    lat: number; // City geolocation, latitude
}

export interface Weather { // more info Weather condition codes
    id: number; // Weather condition id
    main: string; // Group of weather parameters (Rain, Snow, Extreme etc.)
    description: string; // Weather condition within the group. You can get the output in your language. Learn more
    icon: string; // Weather icon id
}

export interface MainWeather {
    temp: number; // Temperature. Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit.
    feels_like: number; // Temperature. This temperature parameter accounts for the human perception of weather. Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit.
    pressure: number; // Atmospheric pressure: (on the sea level, if there is no sea_level or grnd_level data), hPa
    humidity: number; // Humidity, %
    temp_min: null; // Minimum temperature at the moment: null; // This is minimal currently observed temperature (within large megalopolises and urban areas). Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit.
    temp_max: number; // Maximum temperature at the moment. This is maximal currently observed temperature (within large megalopolises and urban areas). Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit.
    sea_level: number; // Atmospheric pressure on the sea level, hPa
    grnd_level: number; // Atmospheric pressure on the ground level, hPa
}

export interface Wind {
    speed: number; // Wind speed. Unit Default: meter/sec, Metric: meter/sec, Imperial: miles/hour.
    deg: number; // Wind direction, degrees (meteorological)
    gust: number; // Wind gust. Unit Default: meter/sec, Metric: meter/sec, Imperial: miles/hour.
}

export interface Clouds {
    all: number; // Cloudiness, %
}

export interface Rain {
    '1h': number; // Rain volume for the last 1 hour, mm
    '3h': number; // Rain volume for the last 3 hours, mm
}

export interface Snow {
    '1h': number; // Snow volume for the last 1 hour, mm
    '3h': number; // Snow volume for the last 3 hours, mm
}

export interface System {
    type: number; // Type of weather data (see Weather condition codes)
    id: number; // Weather condition id
    message: number; // Weather condition within the group. You can get the output in your language. Learn more
    country: string; // Country code (GB, JP etc.)
    sunrise: number; // Sunrise time, unix, UTC
    sunset: number; // Sunset time, unix, UTC
}

export enum Language {  // Language codes
    AF = 'af', // Afrikaans
    AL = 'al', //  Albanian
    AR = 'ar', //  Arabic
    AZ = 'az', //  Azerbaijani
    BG = 'bg', //  Bulgarian
    CA = 'ca', //  Catalan
    CZ = 'cz', //  Czech
    DA = 'da', //  Danish
    DE = 'de', //  German
    EL = 'el', //  Greek
    EN = 'en', //  English
    EU = 'eu', //  Basque
    FA = 'fa', //  Persian (Farsi)
    FI = 'fi', //  Finnish
    FR = 'fr', //  French
    GL = 'gl', //  Galician
    HE = 'he', //  Hebrew
    HI = 'hi', //  Hindi
    HR = 'hr', //  Croatian
    HU = 'hu', //  Hungarian
    ID = 'id', //  Indonesian
    IT = 'it', //  Italian
    JA = 'ja', //  Japanese
    KR = 'kr', //  Korean
    LA = 'la', //  Latvian
    LT = 'lt', //  Lithuanian
    MK = 'mk', //  Macedonian
    NO = 'no', //  Norwegian
    NL = 'nl', //  Dutch
    PL = 'pl', //  Polish
    PT = 'pt', //  Portuguese
    PT_BR = 'pt_br', // Português Brasil
    RO = 'ro', //  Romanian
    RU = 'ru', //  Russian
    SV = 'sv', // , se Swedish
    SK = 'sk', //  Slovak
    SL = 'sl', //  Slovenian
    SP = 'sp', // , es Spanish
    SR = 'sr', //  Serbian
    TH = 'th', //  Thai
    TR = 'tr', //  Turkish
    US = 'ua', // , uk Ukrainian
    VI = 'vi', //  Vietnamese
    ZH = 'zh', // _cn Chinese Simplified
    ZH_TW = 'zh_tw', // Chinese Traditional
    ZU = 'zu' //  Zulu
}
