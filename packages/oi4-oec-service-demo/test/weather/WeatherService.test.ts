import axios from 'axios';

// @ts-ignore
import {BASE_URL, WeatherService} from '../../src/weather/WeatherService';
import {Coordinates} from '../../src/weather/WeatherServiceModel';
import * as fs from "fs";
import {WeatherServiceResponse} from "../../src/weather/WeatherServiceModel";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService.ts test', () => {
    it('should retrieve weather data', async () => {
        const responseData = JSON.parse(fs.readFileSync(`${__dirname}/../__fixtures__/weatherApiResponse.json`, 'utf-8')) as WeatherServiceResponse;
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: responseData
        });

        const weatherService = new WeatherService('123');
        const coords: Coordinates = {lon: 47.9959, lat: 7.8522};
        const response = await weatherService.getWeather(coords);
        expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=123&units=metric&lang=en`);
        expect(response).toEqual(responseData);
    });

    it('should throw error on status 401', async () => {
        const responseData = {
            status: 401,
            statusText: 'Invalid API key. Please see http://openweathermap.org/faq#error401 for more info.',
        }
        mockedAxios.get.mockResolvedValueOnce(responseData);

        const weatherService = new WeatherService('123');
        const coords: Coordinates = {lon: 47.9959, lat: 7.8522};
        await expect(weatherService.getWeather(coords)).rejects.toThrow(`Failed to query OpenWeatherMap API: ${responseData.statusText}`);
    });
});
