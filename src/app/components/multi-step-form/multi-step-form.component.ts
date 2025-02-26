import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { WeatherService } from '../../services/weather.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

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
  ],
})
export class MultiStepFormComponent {
  cityControl = new FormControl('');
  citySuggestions$: Observable<any[]> = new Observable();
  selectedCities: string[] = [];
  isLoading = false;
  private weatherService = inject(WeatherService);

  ngOnInit(): void {
    this.citySuggestions$ = this.cityControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.isLoading = true)),
      switchMap((value) => {
        if (value && value.length > 2 && !this.selectedCities.includes(value)) {
          return this.weatherService.getCitySuggestions(value).pipe(
            catchError((error) => {
              return EMPTY;
            }),
            finalize(() => (this.isLoading = false))
          );
        }
        this.isLoading = false;
        return EMPTY;
      })
    );
  }

  onCitySelect(city: string): void {
    if (!this.selectedCities.includes(city)) {
      this.selectedCities.push(city);
      this.cityControl.setValue('');
    }
  }

  removeCity(city: string): void {
    this.selectedCities = this.selectedCities.filter((c) => c !== city);
  }
}
