import { SingaporeRegion, PSIBand, RegionData, PSIResponse, HourlyForecastItem } from '../types/psi';

export const REGION_COORDINATES: Record<SingaporeRegion, { lat: number; lng: number; name: string; stationName: string }> = {
  central: { lat: 1.35735, lng: 103.82000, name: 'Central', stationName: 'Bishan / Ang Mo Kio' },
  north: { lat: 1.41803, lng: 103.82000, name: 'North', stationName: 'Woodlands / Sembawang' },
  south: { lat: 1.29587, lng: 103.82000, name: 'South', stationName: 'Marina Bay / Bukit Merah' },
  east: { lat: 1.35735, lng: 103.94000, name: 'East', stationName: 'Changi / Bedok' },
  west: { lat: 1.35735, lng: 103.70000, name: 'West', stationName: 'Jurong West / Clementi' },
  national: { lat: 1.3521, lng: 103.8198, name: 'National Average', stationName: 'Singapore Islandwide' },
};

export function getPSIBand(psi: number): PSIBand {
  if (psi <= 50) return 'good';
  if (psi <= 100) return 'moderate';
  if (psi <= 200) return 'unhealthy';
  if (psi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export function getBandDetails(band: PSIBand) {
  switch (band) {
    case 'good':
      return {
        label: 'Good',
        range: '0 – 50',
        colorText: 'text-emerald-700',
        bgSubtle: 'bg-emerald-50',
        border: 'border-emerald-200',
        hex: '#059669',
        summary: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        generalPublicAdvice: 'Normal outdoor activities can be continued as usual.',
        vulnerableGroupAdvice: 'Normal outdoor activities can be continued as usual.',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        range: '51 – 100',
        colorText: 'text-blue-700',
        bgSubtle: 'bg-blue-50',
        border: 'border-blue-200',
        hex: '#2563eb',
        summary: 'Air quality is acceptable; however, very sensitive individuals may experience minor symptoms.',
        generalPublicAdvice: 'Normal activities can continue for the general population.',
        vulnerableGroupAdvice: 'Sensitive individuals should monitor for respiratory discomfort.',
      };
    case 'unhealthy':
      return {
        label: 'Unhealthy',
        range: '101 – 200',
        colorText: 'text-amber-700',
        bgSubtle: 'bg-amber-50',
        border: 'border-amber-200',
        hex: '#d97706',
        summary: 'Air quality drops below safe national standards. Prolonged exposure causes irritation.',
        generalPublicAdvice: 'Reduce prolonged or strenuous outdoor physical exertion.',
        vulnerableGroupAdvice: 'Minimize outdoor exertion. Children, elderly & asthma patients stay indoors.',
      };
    case 'very_unhealthy':
      return {
        label: 'Very Unhealthy',
        range: '201 – 300',
        colorText: 'text-rose-700',
        bgSubtle: 'bg-rose-50',
        border: 'border-rose-200',
        hex: '#e11d48',
        summary: 'Health alert: risk of serious health impacts across the general population.',
        generalPublicAdvice: 'Avoid prolonged or strenuous outdoor physical exertion.',
        vulnerableGroupAdvice: 'Avoid outdoor activities. Wear certified N95 masks if outdoors.',
      };
    case 'hazardous':
      return {
        label: 'Hazardous',
        range: '> 300',
        colorText: 'text-red-900',
        bgSubtle: 'bg-red-50',
        border: 'border-red-300',
        hex: '#991b1b',
        summary: 'Emergency conditions. Air pollution represents serious danger to all individuals.',
        generalPublicAdvice: 'Minimize outdoor activity. Close windows and turn on air purifiers.',
        vulnerableGroupAdvice: 'Stay indoors with windows closed. Vulnerable individuals strictly remain indoors.',
      };
  }
}

export function getPM25Band(pm25: number): { band: string; label: string; color: string; hex: string } {
  if (pm25 <= 55) {
    return { band: 'Band I', label: 'Normal', color: 'text-emerald-700', hex: '#059669' };
  } else if (pm25 <= 150) {
    return { band: 'Band II', label: 'Elevated', color: 'text-amber-700', hex: '#d97706' };
  } else if (pm25 <= 250) {
    return { band: 'Band III', label: 'High', color: 'text-rose-700', hex: '#e11d48' };
  } else {
    return { band: 'Band IV', label: 'Very High', color: 'text-red-900', hex: '#991b1b' };
  }
}

/**
 * Fetch official NEA data via /api/psi or direct data.gov.sg v2 endpoint
 */
export async function fetchLiveNEAData(): Promise<PSIResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  // Try serverless endpoint /api/psi first
  try {
    const apiRes = await fetch('/api/psi', { signal: controller.signal });
    if (apiRes.ok) {
      const serverlessData = await apiRes.json();
      clearTimeout(timeoutId);
      if (serverlessData.readings) {
        return parseReadingsPayload(
          serverlessData.readings,
          serverlessData.updatedTimestamp || serverlessData.timestamp
        );
      }
    }
  } catch (err) {
    console.debug('Local /api/psi call not ready, falling back to direct data.gov.sg endpoint:', err);
  }

  // Direct fallback to data.gov.sg v2 endpoint
  try {
    const directRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi');
    if (directRes.ok) {
      const data = await directRes.json();
      const item = data?.data?.items?.[0];
      if (item?.readings) {
        return parseReadingsPayload(item.readings, item.updatedTimestamp || item.timestamp);
      }
    }
  } catch (err) {
    console.warn('Direct data.gov.sg v2 call failed:', err);
  }

  return getSyntheticScenario('live_baseline');
}

// Unified parser for NEA readings dictionary
function parseReadingsPayload(readings: any, timestampStr: string): PSIResponse {
  const timestamp = timestampStr || new Date().toISOString();
  const regionsList: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];
  const regionsData: Partial<Record<SingaporeRegion, RegionData>> = {};
  let totalPsi = 0;

  for (const r of regionsList) {
    const psi = Math.round(readings?.psi_twenty_four_hourly?.[r] ?? 42);
    totalPsi += psi;
    const band = getPSIBand(psi);
    const bandInfo = getBandDetails(band);

    regionsData[r] = {
      region: r,
      displayName: REGION_COORDINATES[r].name,
      coordinates: {
        lat: REGION_COORDINATES[r].lat,
        lng: REGION_COORDINATES[r].lng,
      },
      psi,
      pm25_1h: Math.round(readings?.pm25_one_hourly?.[r] ?? readings?.pm25_twenty_four_hourly?.[r] ?? Math.round(psi * 0.7)),
      pm25_24h: Math.round(readings?.pm25_twenty_four_hourly?.[r] ?? Math.round(psi * 0.65)),
      pm10_24h: Math.round(readings?.pm10_twenty_four_hourly?.[r] ?? Math.round(psi * 0.85)),
      o3_8h: Math.round(readings?.o3_eight_hour_max?.[r] ?? 38),
      no2_1h: Math.round(readings?.no2_one_hour_max?.[r] ?? 24),
      so2_24h: Math.round(readings?.so2_twenty_four_hourly?.[r] ?? 12),
      co_8h: Number((readings?.co_eight_hour_max?.[r] ?? 0.8).toFixed(1)),
      band,
      statusLabel: bandInfo.label,
      statusDescription: bandInfo.summary,
      updateTimestamp: timestamp,
    };
  }

  const nationalPsi = Math.round(readings?.psi_twenty_four_hourly?.national ?? (totalPsi / 5));
  const natBand = getPSIBand(nationalPsi);
  const natBandInfo = getBandDetails(natBand);

  regionsData['national'] = {
    region: 'national',
    displayName: 'National Average',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    psi: nationalPsi,
    pm25_1h: Math.round(readings?.pm25_one_hourly?.national ?? (nationalPsi * 0.7)),
    pm25_24h: Math.round(readings?.pm25_twenty_four_hourly?.national ?? (nationalPsi * 0.65)),
    pm10_24h: Math.round(readings?.pm10_twenty_four_hourly?.national ?? (nationalPsi * 0.85)),
    o3_8h: Math.round(readings?.o3_eight_hour_max?.national ?? 35),
    no2_1h: Math.round(readings?.no2_one_hour_max?.national ?? 22),
    so2_24h: Math.round(readings?.so2_twenty_four_hourly?.national ?? 11),
    co_8h: 0.8,
    band: natBand,
    statusLabel: natBandInfo.label,
    statusDescription: natBandInfo.summary,
    updateTimestamp: timestamp,
  };

  return {
    timestamp,
    regions: regionsData as Record<SingaporeRegion, RegionData>,
    nationalAverage: nationalPsi,
    nationalBand: natBand,
    weatherSummary: {
      windSpeedKmH: 14,
      windDirection: 'South-Southwest (SSW)',
      temperatureC: 31,
      relativeHumidity: 74,
      hotspotsSumatra: 28,
      generalHazeRisk: nationalPsi > 100 ? 'High' : 'Low',
    },
  };
}



export type PresetScenario = 'live_baseline' | 'moderate' | 'unhealthy_haze' | 'very_unhealthy' | 'hazardous';

/**
 * Returns authentic synthetic scenarios for alert testing and haze drill
 */
export function getSyntheticScenario(scenario: PresetScenario): PSIResponse {
  const now = new Date().toISOString();

  let psiValues: Record<SingaporeRegion, number>;
  let pm25OneHour: Record<SingaporeRegion, number>;
  let weather = {
    windSpeedKmH: 12,
    windDirection: 'South-Southwest (SSW)',
    temperatureC: 31,
    relativeHumidity: 72,
    hotspotsSumatra: 14,
    generalHazeRisk: 'Low' as 'Low' | 'Moderate' | 'High',
  };

  switch (scenario) {
    case 'unhealthy_haze':
      psiValues = {
        central: 124,
        north: 108,
        south: 138,
        east: 112,
        west: 145,
        national: 126,
      };
      pm25OneHour = {
        central: 68,
        north: 58,
        south: 78,
        east: 62,
        west: 86,
        national: 70,
      };
      weather = {
        windSpeedKmH: 22,
        windDirection: 'Southwest (SW)',
        temperatureC: 32,
        relativeHumidity: 65,
        hotspotsSumatra: 184,
        generalHazeRisk: 'High',
      };
      break;

    case 'very_unhealthy':
      psiValues = {
        central: 215,
        north: 198,
        south: 235,
        east: 205,
        west: 248,
        national: 220,
      };
      pm25OneHour = {
        central: 145,
        north: 130,
        south: 165,
        east: 138,
        west: 178,
        national: 151,
      };
      weather = {
        windSpeedKmH: 26,
        windDirection: 'South-Southwest (SSW)',
        temperatureC: 33,
        relativeHumidity: 58,
        hotspotsSumatra: 340,
        generalHazeRisk: 'High',
      };
      break;

    case 'hazardous':
      psiValues = {
        central: 325,
        north: 305,
        south: 345,
        east: 315,
        west: 360,
        national: 330,
      };
      pm25OneHour = {
        central: 265,
        north: 240,
        south: 290,
        east: 255,
        west: 310,
        national: 272,
      };
      weather = {
        windSpeedKmH: 30,
        windDirection: 'Southwest (SW)',
        temperatureC: 34,
        relativeHumidity: 52,
        hotspotsSumatra: 520,
        generalHazeRisk: 'High',
      };
      break;

    case 'moderate':
      psiValues = {
        central: 68,
        north: 62,
        south: 74,
        east: 59,
        west: 78,
        national: 68,
      };
      pm25OneHour = {
        central: 32,
        north: 28,
        south: 38,
        east: 26,
        west: 42,
        national: 33,
      };
      weather = {
        windSpeedKmH: 15,
        windDirection: 'Southeast (SE)',
        temperatureC: 31,
        relativeHumidity: 75,
        hotspotsSumatra: 38,
        generalHazeRisk: 'Moderate',
      };
      break;

    case 'live_baseline':
    default:
      psiValues = {
        central: 38,
        north: 42,
        south: 36,
        east: 32,
        west: 44,
        national: 38,
      };
      pm25OneHour = {
        central: 14,
        north: 16,
        south: 12,
        east: 11,
        west: 18,
        national: 14,
      };
      weather = {
        windSpeedKmH: 11,
        windDirection: 'East-Northeast (ENE)',
        temperatureC: 30,
        relativeHumidity: 78,
        hotspotsSumatra: 8,
        generalHazeRisk: 'Low',
      };
      break;
  }

  const regions: Record<SingaporeRegion, RegionData> = {
    central: {
      region: 'central',
      displayName: 'Central',
      coordinates: REGION_COORDINATES.central,
      psi: psiValues.central,
      pm25_1h: pm25OneHour.central,
      pm25_24h: Math.round(psiValues.central * 0.38),
      pm10_24h: Math.round(psiValues.central * 0.58),
      o3_8h: Math.round(psiValues.central * 0.42),
      no2_1h: 22,
      so2_24h: 11,
      co_8h: 0.8,
      band: getPSIBand(psiValues.central),
      statusLabel: getBandDetails(getPSIBand(psiValues.central)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.central)).summary,
      updateTimestamp: now,
    },
    north: {
      region: 'north',
      displayName: 'North',
      coordinates: REGION_COORDINATES.north,
      psi: psiValues.north,
      pm25_1h: pm25OneHour.north,
      pm25_24h: Math.round(psiValues.north * 0.38),
      pm10_24h: Math.round(psiValues.north * 0.58),
      o3_8h: Math.round(psiValues.north * 0.4),
      no2_1h: 18,
      so2_24h: 9,
      co_8h: 0.7,
      band: getPSIBand(psiValues.north),
      statusLabel: getBandDetails(getPSIBand(psiValues.north)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.north)).summary,
      updateTimestamp: now,
    },
    south: {
      region: 'south',
      displayName: 'South',
      coordinates: REGION_COORDINATES.south,
      psi: psiValues.south,
      pm25_1h: pm25OneHour.south,
      pm25_24h: Math.round(psiValues.south * 0.38),
      pm10_24h: Math.round(psiValues.south * 0.58),
      o3_8h: Math.round(psiValues.south * 0.44),
      no2_1h: 24,
      so2_24h: 14,
      co_8h: 0.9,
      band: getPSIBand(psiValues.south),
      statusLabel: getBandDetails(getPSIBand(psiValues.south)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.south)).summary,
      updateTimestamp: now,
    },
    east: {
      region: 'east',
      displayName: 'East',
      coordinates: REGION_COORDINATES.east,
      psi: psiValues.east,
      pm25_1h: pm25OneHour.east,
      pm25_24h: Math.round(psiValues.east * 0.38),
      pm10_24h: Math.round(psiValues.east * 0.56),
      o3_8h: Math.round(psiValues.east * 0.39),
      no2_1h: 19,
      so2_24h: 10,
      co_8h: 0.7,
      band: getPSIBand(psiValues.east),
      statusLabel: getBandDetails(getPSIBand(psiValues.east)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.east)).summary,
      updateTimestamp: now,
    },
    west: {
      region: 'west',
      displayName: 'West',
      coordinates: REGION_COORDINATES.west,
      psi: psiValues.west,
      pm25_1h: pm25OneHour.west,
      pm25_24h: Math.round(psiValues.west * 0.4),
      pm10_24h: Math.round(psiValues.west * 0.62),
      o3_8h: Math.round(psiValues.west * 0.45),
      no2_1h: 26,
      so2_24h: 16,
      co_8h: 1.0,
      band: getPSIBand(psiValues.west),
      statusLabel: getBandDetails(getPSIBand(psiValues.west)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.west)).summary,
      updateTimestamp: now,
    },
    national: {
      region: 'national',
      displayName: 'National Average',
      coordinates: REGION_COORDINATES.national,
      psi: psiValues.national,
      pm25_1h: pm25OneHour.national,
      pm25_24h: Math.round(psiValues.national * 0.38),
      pm10_24h: Math.round(psiValues.national * 0.58),
      o3_8h: Math.round(psiValues.national * 0.41),
      no2_1h: 22,
      so2_24h: 12,
      co_8h: 0.8,
      band: getPSIBand(psiValues.national),
      statusLabel: getBandDetails(getPSIBand(psiValues.national)).label,
      statusDescription: getBandDetails(getPSIBand(psiValues.national)).summary,
      updateTimestamp: now,
    },
  };

  return {
    timestamp: now,
    regions,
    nationalAverage: psiValues.national,
    nationalBand: getPSIBand(psiValues.national),
    weatherSummary: weather,
  };
}

/**
 * Generate 24-hour historical & forecast trend points
 */
export function generateHourlyTrends(currentBase: number): HourlyForecastItem[] {
  const result: HourlyForecastItem[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = d.getHours();
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;

    // Realistic diurnal curve: lowest at night/dawn, peaks mid afternoon
    const diurnalFactor = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 0.22;
    const noise = Math.sin(i * 1.7) * 3;
    const baseValue = Math.max(15, Math.round(currentBase * (1 + diurnalFactor) + noise));

    result.push({
      time: timeStr,
      hour,
      central: Math.max(10, Math.round(baseValue * 0.98)),
      north: Math.max(10, Math.round(baseValue * 1.02)),
      south: Math.max(10, Math.round(baseValue * 1.05)),
      east: Math.max(10, Math.round(baseValue * 0.94)),
      west: Math.max(10, Math.round(baseValue * 1.09)),
      overall: baseValue,
    });
  }

  return result;
}
