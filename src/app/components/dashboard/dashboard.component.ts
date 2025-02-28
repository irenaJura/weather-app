import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
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
import { catchError, EMPTY, forkJoin, tap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { WeatherTableData } from '../../models/weather-table-data.interface';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { BaseChartDirective } from 'ng2-charts';
import { ChartDataset } from 'chart.js';
import {
  SelectedCityData,
  WeatherDataTransferService,
} from '../../services/weather-data-transfer.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    BaseChartDirective,
  ],
  providers: [WeatherService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private weatherDataTransferService = inject(WeatherDataTransferService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['city', 'temp', 'humidity', 'condition'];

  testWeatherData: {
    city: string;
    lat: number;
    lon: number;
    data?: WeatherData;
    metrics?: string[];
    layout?: string;
    chartType?: string;
  }[] = [
    { city: 'New York', lat: 40.7128, lon: -74.006 },
    { city: 'London', lat: 51.5074, lon: -0.1278 },
    { city: 'Tokyo', lat: 35.682839, lon: 139.759455 },
  ];

  isLoading = false;

  dataSource = new MatTableDataSource<WeatherTableData>([]);

  @ViewChild(MatSort) sort!: MatSort;

  chartData: ChartDataset<'line'>[] = [];
  chartLabels: string[] = [];
  chartOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Days' } },
      y: { title: { display: true, text: 'Temperature (°C)' } },
    },
  };

  chartLegend = true;
  chartVisible = false;
  selectedCity = '';

  ngOnInit() {
    this.fetchWeatherData();

    this.weatherDataTransferService.newCity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cityData) => {
        if (cityData) {
          this.addCityWithWeather(cityData);
        }
      });
  }

  fetchWeatherData() {
    const requests = this.testWeatherData.map((cityData) =>
      this.weatherService.getWeatherData(cityData.lat, cityData.lon).pipe(
        tap(() => {
          this.isLoading = true;
        }),
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

  onCityClick(cityData: any): void {
    this.chartVisible = true;

    if (this.selectedCity === cityData.city) {
      return;
    }

    this.selectedCity = cityData.city;
    const weather = cityData.data as WeatherData;

    const dailyData = weather.daily;

    this.chartLabels = dailyData.map((day) => {
      const date = new Date(day.dt * 1000);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    });

    this.chartData = [
      {
        data: dailyData.map((day) => +day.temp.max.toFixed(1)),
        label: 'Max Temperature',
        borderColor: 'red',
        fill: true,
      },
      {
        data: dailyData.map((day) => +day.temp.min.toFixed(1)),
        label: 'Min Temperature',
        borderColor: 'blue',
        fill: true,
      },
    ];
  }

  addCityWithWeather(cityData: SelectedCityData) {
    const { city, metrics, layout, chartType } = cityData;

    this.weatherService
      .getWeatherData(city.lat, city.lon)
      .subscribe((weatherData) => {
        const newCity = {
          city: city.name,
          lat: city.lat,
          lon: city.lon,
          data: weatherData,
          metrics,
          layout,
          chartType,
        };

        this.testWeatherData = [...this.testWeatherData, newCity];
        this.updateTableData();

        console.log('New city added:', newCity);
      });
  }

  private updateTableData() {
    this.dataSource.data = this.testWeatherData;
    this.dataSource.sort = this.sort;
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
