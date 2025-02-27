export interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: {
      description: string;
      icon: string;
    }[];
  };
  daily: {
    dt: number;
    temp: {
      max: number;
      min: number;
    };
    weather: {
      description: string;
      icon: string;
    }[];
  }[];
}
