import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WeatherData } from '../../models/weather-data.model';
import { WeatherService } from '../../services/weather.service';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, forkJoin } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { WeatherTableData } from '../../models/weather-table-data.interface';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSortModule,
  ],
  providers: [WeatherService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private changeDetectorRef = inject(ChangeDetectorRef);
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

  isLoading = true;

  dataSource = new MatTableDataSource<WeatherTableData>([]);

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.fetchWeatherData();
  }

  fetchWeatherData() {
    const requests = this.testWeatherData.map((cityData) =>
      this.weatherService.getWeatherData(cityData.lat, cityData.lon).pipe(
        catchError((error) => {
          this.isLoading = false;
          return EMPTY;
        })
      )
    );

    forkJoin(requests)
      .pipe(
        catchError((error) => {
          this.isLoading = false;
          return EMPTY;
        })
      )
      .subscribe((results) => {
        results.forEach(
          (data, index) => (this.testWeatherData[index].data = data)
        );
        this.isLoading = false;
        this.dataSource.data = this.testWeatherData;
        // ensure table got new data before sorting
        this.changeDetectorRef.detectChanges();
        this.dataSource.sort = this.sort;
        this.initSort();
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private initSort() {
    this.dataSource.sortingDataAccessor = (
      item: WeatherTableData,
      property: string
    ) => {
      switch (property) {
        case 'city':
          return item.city;
        case 'temp':
          return item.data?.current.temp || 0;
        case 'humidity':
          return item.data?.current.humidity || 0;
        case 'condition':
          return item.data?.current.weather[0]?.description || '';
        default:
          return '';
      }
    };
  }
}
