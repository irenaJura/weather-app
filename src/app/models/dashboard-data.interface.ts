import { ChartType } from 'chart.js';
import { WeatherData } from './weather-data.model';
export interface DashboardData {
  city: string;
  lat: number;
  lon: number;
  data?: WeatherData;
  metrics?: string[];
  layout?: string;
  chartType?: ChartType;
}
