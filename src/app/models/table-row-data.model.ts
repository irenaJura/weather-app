export interface WeatherTableRow {
  city: string;
  temp?: number;
  humidity?: number;
  condition?: string;
  windSpeed?: number;
}

export interface ColumnConfig {
  id: keyof WeatherTableRow;
  label: string;
}
