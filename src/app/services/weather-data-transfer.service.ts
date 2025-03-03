import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { City } from '../models/city.model';
import { ChartType } from 'chart.js';

export interface SelectedCityData {
  city: City;
  metrics: string[];
  layout: string;
  chartType: ChartType;
}

@Injectable({ providedIn: 'root' })
export class WeatherDataTransferService {
  private newCitySubject = new BehaviorSubject<SelectedCityData | null>(null);

  newCity$ = this.newCitySubject.asObservable();

  sendNewCityData(data: SelectedCityData): void {
    this.newCitySubject.next(data);
  }

  clear(): void {
    this.newCitySubject.next(null);
  }
}
