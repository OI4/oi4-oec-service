import axios from 'axios';
import {Coordinates, Language, WeatherServiceResponse} from './WeatherServiceModel';

export const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export class WeatherService {

    private readonly appid: string;
    private readonly units: string;

    constructor(appid: string, units = 'metric') {
        this.appid = appid;
        this.units = units;
    }

    async getWeather(coordinates: Coordinates, language = Language.EN): Promise<WeatherServiceResponse> {
        const url = `${BASE_URL}?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.appid}&units=${this.units}&lang=${language}`;
        const response = await axios.get(url).catch(err => {
            throw err;
        });
        if(response.status !== 200) {
            throw new Error(`Failed to query OpenWeatherMap API: ${response.statusText}`);
        }
        return response.data;
    }
}
