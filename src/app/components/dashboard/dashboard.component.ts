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
import { catchError, EMPTY, forkJoin, map, tap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { BaseChartDirective } from 'ng2-charts';
import { ChartDataset, ChartType } from 'chart.js';
import {
  SelectedCityData,
  WeatherDataTransferService,
} from '../../services/weather-data-transfer.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ColumnConfig,
  WeatherTableRow,
} from '../../models/table-row-data.model';
import { DashboardData } from '../../models/dashboard-data.interface';
import { WeatherStateService } from '../../services/weather-state.service';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule,
  ],
  providers: [WeatherService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private weatherDataTransferService = inject(WeatherDataTransferService);
  private weatherStateService = inject(WeatherStateService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  displayedColumns: ColumnConfig[] = [
    { id: 'city', label: 'City' },
    { id: 'temp', label: 'Temperature (°C)' },
    { id: 'humidity', label: 'Humidity (%)' },
    { id: 'windSpeed', label: 'Wind Speed (km/h)' },
    { id: 'condition', label: 'Condition' },
  ];

  displayedColumnIds = this.displayedColumns.map((column) => column.id);

  private cityDataMap = new Map<string, WeatherData>();

  testWeatherData: DashboardData[] = [
    { city: 'New York', lat: 40.7128, lon: -74.006 },
    { city: 'London', lat: 51.5074, lon: -0.1278 },
    { city: 'Tokyo', lat: 35.682839, lon: 139.759455 },
  ];

  isLoading = false;
  errorMessage = '';

  dataSource = new MatTableDataSource<WeatherTableRow>([]);
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
  selectedChartType: ChartType = 'line';
  selectedLayout = 'table';

  ngOnInit() {
    this.isLoading = true;
    this.weatherStateService.cities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cities) => {
        this.cityDataMap.clear();
        cities.forEach((city) => {
          if (city.data) {
            this.cityDataMap.set(city.city, city.data);
          }
        });
        this.updateTableData(cities);
        this.isLoading = false;
        if (cities.length > 0) {
          this.updateDisplayedWeatherInfo(cities[0].metrics!);
          this.selectedChartType = cities[0].chartType!;
          this.selectedLayout = cities[0].layout!;
        }
      });

    this.weatherDataTransferService.newCity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cityData) => {
        if (cityData) {
          this.addCityWithWeather(cityData);
        }
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onCityClick(row: WeatherTableRow): void {
    this.chartVisible = true;

    if (this.selectedCity === row.city) {
      return;
    }

    this.selectedCity = row.city;
    const weather = this.cityDataMap.get(row.city);
    const dailyData = weather!.daily;

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

  addCityWithWeather(data: SelectedCityData): void {
    this.isLoading = true;

    const { cities, metrics, layout, chartType } = data;

    const requests = cities.map((city) =>
      this.weatherService.getWeatherData(city.lat, city.lon).pipe(
        map((weatherData) => ({
          city,
          weatherData,
        })),
        catchError((err) => {
          this.errorMessage = `Failed to load weather data. Please try again.`;
          return EMPTY;
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        results.forEach(({ city, weatherData }) => {
          const newCity = {
            city: city.name,
            lat: city.lat,
            lon: city.lon,
            data: weatherData,
            metrics,
            layout,
            chartType,
          };
          this.weatherStateService.addCity(newCity);
          this.cityDataMap.set(city.name, weatherData);
        });

        this.updateDisplayedWeatherInfo(metrics);
        this.selectedChartType = chartType;
        this.selectedLayout = layout;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private updateTableData(cities: DashboardData[]) {
    this.dataSource.data = cities.map((cityData) => ({
      city: cityData.city,
      temp: cityData.data?.current?.temp
        ? Math.round(cityData.data.current.temp)
        : undefined,
      humidity: cityData.data?.current?.humidity
        ? Math.round(cityData.data.current.humidity)
        : undefined,
      windSpeed: cityData.data?.current?.wind_speed
        ? Math.round(cityData.data.current.wind_speed)
        : undefined,
      condition: cityData.data?.current?.weather[0]?.description ?? undefined,
    }));
    // ensure table got new data before sorting
    this.changeDetectorRef.detectChanges();
    this.dataSource.sort = this.sort;
    this.initSort();
  }

  updateDisplayedWeatherInfo(selectedMetrics: string[]) {
    const metricColumnMap: Record<string, ColumnConfig> = {
      temperature: { id: 'temp', label: 'Temperature (°C)' },
      humidity: { id: 'humidity', label: 'Humidity (%)' },
      windSpeed: { id: 'windSpeed', label: 'Wind Speed (km/h)' },
    };

    this.displayedColumns = [
      { id: 'city', label: 'City' },
      ...selectedMetrics.map(
        (metric) => metricColumnMap[metric] ?? { id: metric, label: metric }
      ),
      { id: 'condition', label: 'Condition' },
    ];

    this.displayedColumnIds = this.displayedColumns.map((column) => column.id);
  }

  private initSort() {
    this.dataSource.sortingDataAccessor = (
      row: WeatherTableRow,
      property: string
    ) => {
      return row[property as keyof WeatherTableRow] ?? '';
    };
  }
}
