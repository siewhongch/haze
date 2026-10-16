import type { Request, Response } from 'express';

const DATA_GOV_SG_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

export interface DataGovSgPsiResponse {
  code: number;
  data: {
    regionMetadata: Array<{
      name: string;
      labelLocation: {
        latitude: number;
        longitude: number;
      };
    }>;
    items: Array<{
      date: string;
      updatedTimestamp: string;
      timestamp: string;
      readings: Record<string, Record<string, number>>;
    }>;
  };
  errorMsg?: string;
}

/**
 * Serverless API handler for Singapore PSI data from data.gov.sg
 * GET /api/psi
 */
export default async function handler(req: Request | any, res: Response | any) {
  // CORS & caching headers for serverless edge deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(DATA_GOV_SG_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BreezeSG-Serverless-Client/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`data.gov.sg returned HTTP status ${response.status} ${response.statusText}`);
    }

    const payload: DataGovSgPsiResponse = await response.json();

    if (payload.code !== 0 && payload.errorMsg) {
      throw new Error(`data.gov.sg API error: ${payload.errorMsg}`);
    }

    const item = payload.data?.items?.[0];
    const readings = item?.readings || {};
    const regions = ['central', 'north', 'south', 'east', 'west'];

    // Compute national averages
    const psiValues = regions.map((r) => readings.psi_twenty_four_hourly?.[r] ?? 0).filter((v) => v > 0);
    const nationalAveragePsi = psiValues.length > 0 ? Math.round(psiValues.reduce((a, b) => a + b, 0) / psiValues.length) : 0;

    const pm25Values = regions.map((r) => readings.pm25_twenty_four_hourly?.[r] ?? 0).filter((v) => v > 0);
    const nationalAveragePm25 = pm25Values.length > 0 ? Math.round(pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length) : 0;

    // Check if client requested raw data
    const isRawRequested = req.query?.raw === 'true';

    if (isRawRequested) {
      return res.status(200).json(payload);
    }

    return res.status(200).json({
      success: true,
      source: DATA_GOV_SG_ENDPOINT,
      timestamp: item?.timestamp || new Date().toISOString(),
      updatedTimestamp: item?.updatedTimestamp || new Date().toISOString(),
      date: item?.date,
      summary: {
        nationalAveragePsi,
        nationalAveragePm25,
        highestRegion: regions.reduce((max, r) => {
          const current = readings.psi_twenty_four_hourly?.[r] ?? 0;
          const maxVal = readings.psi_twenty_four_hourly?.[max] ?? 0;
          return current > maxVal ? r : max;
        }, 'central'),
      },
      regionMetadata: payload.data?.regionMetadata,
      readings,
      raw: payload,
    });
  } catch (error: any) {
    console.error('Error fetching live PSI from data.gov.sg:', error);

    return res.status(502).json({
      success: false,
      error: 'Upstream data.gov.sg fetch failed',
      message: error?.message || 'Failed to communicate with data.gov.sg',
      source: DATA_GOV_SG_ENDPOINT,
      timestamp: new Date().toISOString(),
    });
  }
}
