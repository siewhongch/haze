import React, { useState } from 'react';
import { RegionData, HourlyForecastItem } from '../types/psi';
import { Activity, BarChart3, TrendingUp, Info } from 'lucide-react';

interface PollutantAnalyticsProps {
  regionData: RegionData;
  hourlyTrends: HourlyForecastItem[];
}

export const PollutantAnalytics: React.FC<PollutantAnalyticsProps> = ({
  regionData,
  hourlyTrends,
}) => {
  const [activeChartRegion, setActiveChartRegion] = useState<'overall' | 'central' | 'north' | 'south' | 'east' | 'west'>('overall');

  // Singapore National Ambient Air Quality Standards (NEA benchmarks)
  const pollutantStandards = [
    {
      name: 'PM2.5 (1-Hour)',
      sub: 'Fine Particulates ≤ 2.5µm',
      current: regionData.pm25_1h,
      unit: 'µg/m³',
      limit: 55,
      limitLabel: '55 µg/m³ (Band I Upper Limit)',
      description: 'Microscopic particles that penetrate deep into the lungs and enter the bloodstream.',
    },
    {
      name: 'PM2.5 (24-Hour)',
      sub: '24-Hour Average',
      current: regionData.pm25_24h,
      unit: 'µg/m³',
      limit: 35,
      limitLabel: '35 µg/m³ (National 24-hr Target)',
      description: 'Primary driver of transboundary haze from regional biomass burning.',
    },
    {
      name: 'PM10 (24-Hour)',
      sub: 'Coarse Particulates ≤ 10µm',
      current: regionData.pm10_24h,
      unit: 'µg/m³',
      limit: 100,
      limitLabel: '100 µg/m³ (24-hr Standard)',
      description: 'Dust, pollen, and combustion products that irritate nasal and bronchial passages.',
    },
    {
      name: 'Ozone (O3)',
      sub: '8-Hour Max Running',
      current: regionData.o3_8h,
      unit: 'µg/m³',
      limit: 100,
      limitLabel: '100 µg/m³ (8-hr Standard)',
      description: 'Formed via photochemical reactions between NOx and VOCs under intense equatorial sunlight.',
    },
    {
      name: 'Nitrogen Dioxide (NO2)',
      sub: '1-Hour Max',
      current: regionData.no2_1h,
      unit: 'µg/m³',
      limit: 200,
      limitLabel: '200 µg/m³ (1-hr Standard)',
      description: 'Generated primarily from motor vehicles, shipping, and power generation.',
    },
    {
      name: 'Sulphur Dioxide (SO2)',
      sub: '24-Hour Average',
      current: regionData.so2_24h,
      unit: 'µg/m³',
      limit: 50,
      limitLabel: '50 µg/m³ (24-hr Standard)',
      description: 'Produced by industrial refineries and marine fuel combustion.',
    },
    {
      name: 'Carbon Monoxide (CO)',
      sub: '8-Hour Max',
      current: regionData.co_8h,
      unit: 'mg/m³',
      limit: 10.0,
      limitLabel: '10.0 mg/m³ (8-hr Standard)',
      description: 'Colorless, odorless gas from incomplete combustion in vehicles and industry.',
    },
  ];

  // SVG Trend Chart math
  const maxTrend = Math.max(...hourlyTrends.map((d) => d[activeChartRegion]), 60);
  const chartHeight = 180;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 24;

  const points = hourlyTrends.map((d, idx) => {
    const x = paddingX + (idx / (hourlyTrends.length - 1)) * (chartWidth - 2 * paddingX);
    const val = d[activeChartRegion];
    const y = chartHeight - paddingY - (val / (maxTrend * 1.15)) * (chartHeight - 2 * paddingY);
    return { x, y, val, time: d.time, hour: d.hour };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            Singapore Ambient Air Quality Telemetry: {regionData.displayName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key pollutant breakdown compared with Singapore NEA benchmarks and WHO guidelines.
          </p>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Sensors Active
        </span>
      </div>

      {/* 24-Hour Trend Line Section */}
      <div className="px-4 sm:px-6">
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-semibold text-slate-900">
                24-Hour Air Quality Historical Trajectory
              </span>
            </div>

            {/* Region Filter for Trend */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg">
              {(
                [
                  { key: 'overall', label: 'Islandwide' },
                  { key: 'west', label: 'West' },
                  { key: 'central', label: 'Central' },
                  { key: 'north', label: 'North' },
                  { key: 'south', label: 'South' },
                  { key: 'east', label: 'East' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveChartRegion(tab.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeChartRegion === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Trend Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 select-none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Threshold guide line (100 PSI unhealthy line) */}
              {maxTrend >= 90 && (
                <g>
                  <line
                    x1={paddingX}
                    y1={chartHeight - paddingY - (100 / (maxTrend * 1.15)) * (chartHeight - 2 * paddingY)}
                    x2={chartWidth - paddingX}
                    y2={chartHeight - paddingY - (100 / (maxTrend * 1.15)) * (chartHeight - 2 * paddingY)}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                  <text
                    x={chartWidth - paddingX}
                    y={chartHeight - paddingY - (100 / (maxTrend * 1.15)) * (chartHeight - 2 * paddingY) - 4}
                    textAnchor="end"
                    fill="#d97706"
                    className="font-mono text-[9px] font-semibold"
                  >
                    100 Unhealthy Limit
                  </text>
                </g>
              )}

              {/* Area & Line */}
              <path d={areaD} fill="url(#areaGradient)" />
              <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Point dots */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={i === points.length - 1 ? 4.5 : 2.5}
                    fill={i === points.length - 1 ? '#059669' : '#0f172a'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Show hour labels every 3 hours */}
                  {i % 4 === 0 && (
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill="#64748b"
                      className="font-mono text-[10px]"
                    >
                      {p.time}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
            <span>24 hours ago</span>
            <span className="font-mono font-medium text-slate-700">
              Peak: {Math.max(...hourlyTrends.map((d) => d[activeChartRegion]))} PSI · Current: {points[points.length - 1]?.val} PSI
            </span>
            <span>Now (Latest Reading)</span>
          </div>
        </div>
      </div>

      {/* Grid of 7 Pollutants */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pollutantStandards.map((item, idx) => {
            const percentage = Math.min(100, Math.round((item.current / item.limit) * 100));
            const isExceeded = item.current > item.limit;

            return (
              <div
                key={idx}
                className="p-3.5 border border-slate-200 rounded-lg bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.sub}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-base font-bold ${isExceeded ? 'text-amber-700' : 'text-slate-900'}`}>
                        {item.current} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 my-2 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Target: {item.limitLabel}</span>
                    <span className="font-mono">{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
