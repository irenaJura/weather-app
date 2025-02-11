import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../env/environment';
import { WeatherData } from '../models/weather-data.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiKey = environment.openWeatherMapApiKey;
  private apiUrl = environment.openWeatherMapUrl;
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
}
