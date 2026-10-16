export type SingaporeRegion = 'central' | 'north' | 'south' | 'east' | 'west' | 'national';

export type PSIBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export type PresetScenario = 'live_baseline' | 'moderate' | 'unhealthy_haze' | 'very_unhealthy' | 'hazardous';

export interface RegionCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  label: string;
  description: string;
}

export interface PollutantReadings {
  o3_eight_hour_max: number;
  pm10_twenty_four_hourly: number;
  pm25_twenty_four_hourly: number;
  pm25_one_hourly: number;
  so2_twenty_four_hourly: number;
  co_eight_hour_max: number;
  no2_one_hour_max: number;
  psi_twenty_four_hourly: number;
}

export interface RegionData {
  region: SingaporeRegion;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  psi: number;
  pm25_1h: number;
  pm25_24h: number;
  pm10_24h: number;
  o3_8h: number;
  no2_1h: number;
  so2_24h: number;
  co_8h: number;
  band: PSIBand;
  statusLabel: string;
  statusDescription: string;
  updateTimestamp: string;
}

export interface PSIResponse {
  timestamp: string;
  regions: Record<SingaporeRegion, RegionData>;
  nationalAverage: number;
  nationalBand: PSIBand;
  weatherSummary: {
    windSpeedKmH: number;
    windDirection: string;
    temperatureC: number;
    relativeHumidity: number;
    hotspotsSumatra: number;
    generalHazeRisk: 'Low' | 'Moderate' | 'High';
  };
}

export interface AlertRule {
  id: string;
  enabled: boolean;
  thresholdPsi: number;
  targetRegion: SingaporeRegion | 'all';
  triggerOnPm25Spike: boolean;
  pm25Threshold: number;
  soundEnabled: boolean;
  browserPushEnabled: boolean;
}

export interface AlertLogItem {
  id: string;
  timestamp: string;
  region: SingaporeRegion;
  psiValue: number;
  threshold: number;
  metricType: 'PSI' | 'PM2.5';
  title: string;
  message: string;
  severity: 'moderate' | 'warning' | 'critical';
  read: boolean;
}

export interface HourlyForecastItem {
  time: string;
  hour: number;
  central: number;
  north: number;
  south: number;
  east: number;
  west: number;
  overall: number;
}
