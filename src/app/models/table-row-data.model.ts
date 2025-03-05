export interface WeatherTableRow {
  city: string;
  temp?: number;
  humidity?: number;
  condition?: string;
  windSpeed?: number;
  actions?: string;
}

export interface ColumnConfig {
  id: keyof WeatherTableRow;
  label: string;
}
