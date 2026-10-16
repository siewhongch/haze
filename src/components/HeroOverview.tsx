import React from 'react';
import { PSIResponse, SingaporeRegion, PresetScenario } from '../types/psi';
import { getBandDetails, getPM25Band } from '../services/neaService';
import { RefreshCw, Wind, Droplets, Thermometer, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface HeroOverviewProps {
  data: PSIResponse;
  isLoading: boolean;
  onRefresh: () => void;
  activeScenario: PresetScenario | 'live_api';
  onSelectScenario: (scenario: PresetScenario | 'live_api') => void;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  data,
  isLoading,
  onRefresh,
  activeScenario,
  onSelectScenario,
  selectedRegion,
  onSelectRegion,
}) => {
  const currentData = data.regions[selectedRegion] || data.regions.national;
  const bandInfo = getBandDetails(currentData.band);
  const pm25Info = getPM25Band(currentData.pm25_1h);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">National Environment Agency (NEA) Data</span>
            <span aria-hidden="true">·</span>
            <span>Synched: {new Date(data.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{activeScenario === 'live_api' ? 'Live API Feed (GovTech)' : `Simulated Mode (${activeScenario.replace('_', ' ')})`}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scenario simulation selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 hidden sm:inline">Scenario:</span>
            <select
              value={activeScenario}
              onChange={(e) => onSelectScenario(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border-0 focus:ring-2 focus:ring-slate-900"
            >
              <option value="live_api">Live NEA API (GovTech SG)</option>
              <option value="live_baseline">Normal Clean Day (PSI 38)</option>
              <option value="moderate">Moderate Afternoon (PSI 68)</option>
              <option value="unhealthy_haze">Transboundary Haze Spike (PSI 138)</option>
              <option value="very_unhealthy">Severe Regional Haze (PSI 220)</option>
              <option value="hazardous">Hazardous Emergency (PSI 330)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Refresh latest data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Visual & Primary Metrics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Big Key Numbers (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  Singapore Islandwide Telemetry
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                  Air Quality & PSI Tracker
                </h1>
              </div>

              {/* Region Pill-Free Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['national', 'west', 'central', 'north', 'south', 'east'] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => onSelectRegion(reg)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                      selectedRegion === reg
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {reg === 'national' ? 'Islandwide' : reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Unboxed Metadata Line (Strict Anti-Slop Rule) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
              <span>{currentData.displayName} Station</span>
              <span aria-hidden="true">·</span>
              <span>24-Hour PSI Benchmark</span>
              <span aria-hidden="true">·</span>
              <span>Updated Hourly by NEA</span>
            </div>

            {/* Massive Metric Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-y border-slate-100 my-4">
              {/* Metric 1: 24-Hour PSI */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  24-Hour PSI Index
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight tabular-nums"
                    style={{ color: bandInfo.hex }}
                  >
                    {currentData.psi}
                  </span>
                  <div>
                    <div
                      className="text-base font-bold"
                      style={{ color: bandInfo.hex }}
                    >
                      {bandInfo.label}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Band: {bandInfo.range}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {bandInfo.summary}
                </p>
              </div>

              {/* Metric 2: 1-Hour PM2.5 */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  1-Hour PM2.5 Concentration
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight tabular-nums text-slate-900">
                    {currentData.pm25_1h}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-700">
                      µg/m³
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: pm25Info.hex }}
                    >
                      {pm25Info.band} ({pm25Info.label})
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Key indicator for immediate outdoor activity planning (running, cycling, school sports).
                </p>
              </div>
            </div>
          </div>

          {/* Actionable Health Notice at the bottom of the card */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong className="text-slate-900">Action: </strong>
                {bandInfo.generalPublicAdvice}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Singapore Skyline Asset & Weather Telemetry (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="relative h-48 sm:h-56 w-full bg-slate-100 overflow-hidden">
            <img
              src="/src/assets/images/singapore_skyline_clear_1792120431887.jpg"
              alt="Singapore Marina Bay Skyline Atmospheric View"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-xs font-semibold tracking-wide">
                Singapore Islandwide Air Basin
              </div>
              <div className="text-[11px] text-slate-200 opacity-90">
                Continuous optical & particulate telemetry monitoring
              </div>
            </div>
          </div>

          {/* Real-time Environmental Weather Matrix */}
          <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 text-xs bg-slate-50/50">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5" />
                <span className="text-[11px]">Wind Trajectory</span>
              </div>
              <div className="font-semibold text-slate-900 font-mono">
                {data.weatherSummary.windSpeedKmH} km/h
              </div>
              <div className="text-[11px] text-slate-500">
                {data.weatherSummary.windDirection}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sumatra Hotspots</span>
              </div>
              <div className="font-semibold text-slate-900 font-mono">
                {data.weatherSummary.hotspotsSumatra} detected
              </div>
              <div className="text-[11px] text-slate-500">
                Risk: {data.weatherSummary.generalHazeRisk}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span className="text-[11px]">Ambient Temp</span>
              </div>
              <div className="font-semibold text-slate-900 font-mono">
                {data.weatherSummary.temperatureC}°C
              </div>
              <div className="text-[11px] text-slate-500">
                Tropical daylight
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5" />
                <span className="text-[11px]">Relative Humidity</span>
              </div>
              <div className="font-semibold text-slate-900 font-mono">
                {data.weatherSummary.relativeHumidity}%
              </div>
              <div className="text-[11px] text-slate-500">
                Normal moisture
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
