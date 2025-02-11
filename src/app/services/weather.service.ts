import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../env/environment';

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
    exclude: string = '',
    units: string = 'metric',
    lang: string = 'en'
  ): Observable<any> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('exclude', exclude)
      .set('units', units)
      .set('lang', lang);

    return this.http.get(this.apiUrl, { params });
  }
}
