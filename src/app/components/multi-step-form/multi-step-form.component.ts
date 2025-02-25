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
  Observable,
  switchMap,
} from 'rxjs';
import { WeatherService } from '../../services/weather.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
  ],
})
export class MultiStepFormComponent {
  cityControl = new FormControl('');
  citySuggestions$: Observable<any[]> = new Observable();
  selectedCity = '';
  private weatherService = inject(WeatherService);

  ngOnInit(): void {
    this.citySuggestions$ = this.cityControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (value && value.length > 2 && value !== this.selectedCity) {
          return this.weatherService.getCitySuggestions(value).pipe(
            catchError((error) => {
              return EMPTY;
            })
          );
        }
        return EMPTY;
      })
    );
  }

  onCitySelect(city: string): void {
    this.selectedCity = city;
  }
}
