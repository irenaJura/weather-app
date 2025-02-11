import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { WeatherData } from '../../models/weather-data.model';
import { WeatherService } from '../../services/weather.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule],
  providers: [WeatherService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private weatherService = inject(WeatherService);
  displayedColumns: string[] = ['city', 'temp', 'humidity', 'condition'];

  testWeatherData: {
    city: string;
    lat: number;
    lon: number;
    data?: WeatherData;
  }[] = [
    { city: 'New York', lat: 40.7128, lon: -74.006 },
    { city: 'London', lat: 51.5074, lon: -0.1278 },
    { city: 'Tokyo', lat: 35.682839, lon: 139.759455 },
  ];

  ngOnInit() {
    this.fetchWeatherData();
  }

  fetchWeatherData() {
    const requests = this.testWeatherData.map((cityData) =>
      this.weatherService.getWeatherData(cityData.lat, cityData.lon)
    );

    forkJoin(requests).subscribe((results) => {
      results.forEach((data, index) => {
        this.testWeatherData[index].data = data;
      });
    });
  }
}
