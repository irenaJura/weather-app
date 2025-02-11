import { WeatherData } from './weather-data.model';

export interface WeatherTableData {
  city: string;
  lat: number;
  lon: number;
  data?: WeatherData;
}
