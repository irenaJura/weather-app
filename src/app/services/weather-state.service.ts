import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DashboardData } from '../models/dashboard-data.interface';

@Injectable({
  providedIn: 'root',
})
export class WeatherStateService {
  private readonly STORAGE_KEY = 'weatherDashboardState';

  private citiesSubject = new BehaviorSubject<DashboardData[]>(
    this.loadFromStorage()
  );
  cities$ = this.citiesSubject.asObservable();

  addCity(city: DashboardData): void {
    const currentCities = this.citiesSubject.value;

    if (currentCities.some((c) => c.city === city.city)) {
      return;
    }

    const updatedCities = [...currentCities, city];
    this.citiesSubject.next(updatedCities);
    this.saveToStorage(updatedCities);
  }

  removeCity(cityName: string) {
    const updatedCities = this.citiesSubject.value.filter(
      (city) => city.city !== cityName
    );
    this.citiesSubject.next(updatedCities);
    this.saveToStorage(updatedCities);
  }

  private saveToStorage(cities: DashboardData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cities));
  }

  private loadFromStorage(): DashboardData[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}
