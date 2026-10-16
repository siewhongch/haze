import type { Request, Response } from 'express';

/**
 * Health check endpoint for serverless deployment
 * GET /api/health
 */
export default async function handler(req: Request | any, res: Response | any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;

  return res.status(200).json({
    status: 'ok',
    service: 'breezesg-psi-api',
    timestamp: new Date().toISOString(),
    uptime: typeof process.uptime === 'function' ? process.uptime() : 0,
    targetEndpoint: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    environment: process.env.NODE_ENV || 'development',
    memory: memoryUsage
      ? {
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        }
      : undefined,
  });
}
