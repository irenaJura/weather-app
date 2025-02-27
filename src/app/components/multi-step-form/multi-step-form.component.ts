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
  ],
  styleUrls: ['./multi-step-form.component.scss'],
})
export class MultiStepFormComponent {
  cityForm = new FormGroup({
    cityInput: new FormControl(''),
  });
  citySuggestions: City[] = [];
  selectedCities: string[] = [];
  isLoading = false;
  formSubmitted = false;

  get cityControl(): FormControl {
    return this.cityForm.get('cityInput') as FormControl;
  }

  private weatherService = inject(WeatherService);
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
  }

  onCitySelect(city: string): void {
    if (!this.selectedCities.includes(city)) {
      this.selectedCities = [...this.selectedCities, city];
      this.cityControl.setValue('');
      this.citySuggestions = [];
    }
  }

  removeCity(city: string): void {
    this.selectedCities = this.selectedCities.filter((c) => c !== city);
  }

  proceedToNextStep(): void {
    this.formSubmitted = true;

    if (this.selectedCities.length === 0) {
      return;
    }

    if (this.cityForm.valid) {
      console.log('Selected cities:', this.selectedCities);
      // Proceed to next step
    }
  }
}
