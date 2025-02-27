import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { environment } from '../env/environment';
import { WeatherData } from '../models/weather-data.model';
import { City } from '../models/city.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiKey = environment.openWeatherMapApiKey;
  private apiUrl = environment.openWeatherMapUrl;
  private apiCityUrl = environment.openWeatherCityUrl;
  private http = inject(HttpClient);

  getWeatherData(
    lat: number,
    lon: number,
    exclude = 'minutely,hourly',
    units = 'metric',
    lang = 'en'
  ): Observable<WeatherData> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('exclude', exclude)
      .set('units', units)
      .set('lang', lang);

    return this.http.get<WeatherData>(this.apiUrl, { params });
  }

  getCitySuggestions(query: string): Observable<City[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('appid', this.apiKey)
      .set('limit', '5');

    return this.http.get<any>(`${this.apiCityUrl}`, { params });
  }
}
