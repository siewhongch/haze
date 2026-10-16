import React from 'react';
import { SingaporeRegion, RegionData, PSIResponse } from '../types/psi';
import { getBandDetails, getPM25Band, REGION_COORDINATES } from '../services/neaService';
import { ChevronRight, Wind } from 'lucide-react';

interface RegionalCardsProps {
  data: PSIResponse;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
}

export const RegionalCards: React.FC<RegionalCardsProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const regionsList: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Regional Monitoring Stations</h3>
          <p className="text-xs text-slate-500">Live 24-hour PSI and 1-hour PM2.5 readings across Singapore</p>
        </div>
        <span className="text-xs text-slate-500 font-mono">5 Official Zones</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {regionsList.map((regionKey) => {
          const item = data.regions[regionKey];
          if (!item) return null;
          const bandInfo = getBandDetails(item.band);
          const pm25Info = getPM25Band(item.pm25_1h);
          const isSelected = selectedRegion === regionKey;

          return (
            <div
              key={regionKey}
              onClick={() => onSelectRegion(regionKey)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-slate-900 bg-white shadow-sm ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-900 capitalize">
                  {item.displayName}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
                  style={{
                    backgroundColor: `${bandInfo.hex}18`,
                    color: bandInfo.hex,
                  }}
                >
                  {bandInfo.label}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span
                    className="text-2xl font-bold font-mono tracking-tight"
                    style={{ color: bandInfo.hex }}
                  >
                    {item.psi}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 ml-1">
                    PSI
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-slate-700">
                    {item.pm25_1h} <span className="text-[9px] text-slate-400">µg/m³</span>
                  </div>
                  <div className="text-[9px] text-slate-500">1-Hr PM2.5</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>{REGION_COORDINATES[regionKey].stationName.split('/')[0]}</span>
                <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-slate-900' : 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
