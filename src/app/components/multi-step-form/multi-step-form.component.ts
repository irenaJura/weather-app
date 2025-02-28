import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  switchMap,
  tap,
} from 'rxjs';
import { WeatherService } from '../../services/weather.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { City } from '../../models/city.model';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import {
  SelectedCityData,
  WeatherDataTransferService,
} from '../../services/weather-data-transfer.service';
import { Router } from '@angular/router';
@Component({
  selector: 'multi-step-form',
  standalone: true,
  templateUrl: './multi-step-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  styleUrls: ['./multi-step-form.component.scss'],
})
export class MultiStepFormComponent {
  cityForm = new FormGroup({
    cityInput: new FormControl(''),
  });
  metricsForm = new FormGroup({
    temperature: new FormControl(false),
    humidity: new FormControl(false),
    windSpeed: new FormControl(false),
  });
  displayOptionsForm = new FormGroup({
    layout: new FormControl<string | null>(null),
    chartType: new FormControl<string | null>(null),
  });

  citySuggestions: City[] = [];
  selectedCities: City[] = [];
  selectedMetrics: string[] = [];
  selectedLayout: string | null = null;
  selectedChartType: string | null = null;
  isLoading = false;
  formSubmitted = false;
  metricsFormSubmitted = false;
  displayOptionsFormSubmitted = false;
  step = 1;

  get cityControl(): FormControl {
    return this.cityForm.get('cityInput') as FormControl;
  }

  private weatherService = inject(WeatherService);
  private weatherDataTransferService = inject(WeatherDataTransferService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.cityControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.isLoading = true)),
        switchMap((value) => {
          value = value.trim();
          if (value && value.length > 2) {
            return this.weatherService.getCitySuggestions(value).pipe(
              tap((data) => (this.citySuggestions = data)),
              catchError((error) => {
                this.citySuggestions = [];
                return EMPTY;
              }),
              finalize(() => (this.isLoading = false))
            );
          }
          this.citySuggestions = [];
          this.isLoading = false;
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.metricsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.metricsFormSubmitted) {
          const selected = this.getSelectedMetrics();

          if (selected.length > 0) {
            this.metricsFormSubmitted = false;
          }
        }
      });
  }

  onCitySelect(city: City): void {
    if (
      !this.selectedCities.some(
        (c) => c.name === city.name && c.country === city.country
      )
    ) {
      this.selectedCities = [...this.selectedCities, city];
      this.cityControl.setValue('');
      this.citySuggestions = [];
    }
  }

  removeCity(city: City): void {
    this.selectedCities = this.selectedCities.filter(
      (c) => c.name !== city.name && c.country !== city.country
    );
  }

  proceedToStepTwo(): void {
    this.formSubmitted = true;

    if (this.selectedCities.length === 0) {
      return;
    }

    if (this.cityForm.valid) {
      this.step = 2;
    }
  }

  getSelectedMetrics(): string[] {
    return (
      Object.keys(this.metricsForm.value) as Array<
        keyof typeof this.metricsForm.value
      >
    ).filter((key) => this.metricsForm.value[key]);
  }

  proceedToStepThree(): void {
    this.metricsFormSubmitted = true;
    this.selectedMetrics = this.getSelectedMetrics();

    if (this.selectedMetrics.length === 0) {
      return;
    }

    if (this.metricsForm.valid) {
      this.step = 3;
    }
  }

  proceedToFinalStep(): void {
    this.displayOptionsFormSubmitted = true;

    const { layout, chartType } = this.displayOptionsForm.value;
    this.selectedLayout = layout ?? null;
    this.selectedChartType = chartType ?? null;

    if (!layout || !chartType) {
      return;
    }

    this.step = 4;
  }

  confirmSelections(): void {
    if (this.selectedCities.length > 0) {
      const cityData: SelectedCityData = {
        city: this.selectedCities[0], // Only supporting 1 city at a time for now
        metrics: this.selectedMetrics,
        layout: this.selectedLayout!,
        chartType: this.selectedChartType!,
      };

      this.weatherDataTransferService.sendNewCityData(cityData);
    }

    this.router.navigate(['dashboard']);
  }
}
