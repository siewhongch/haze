import React from 'react';
import { RegionData } from '../types/psi';
import { getBandDetails } from '../services/neaService';
import { Shield, Activity, Users, HeartPulse, HardHat, AlertCircle, Wind } from 'lucide-react';

interface HealthAdvisoriesProps {
  regionData: RegionData;
}

export const HealthAdvisories: React.FC<HealthAdvisoriesProps> = ({ regionData }) => {
  const band = regionData.band;
  const bandInfo = getBandDetails(band);
  const psi = regionData.psi;

  // Recommendations tailored to current band
  const isHealthyAlert = psi > 100;
  const isSevere = psi > 200;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            NEA Health Advisory: {regionData.displayName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ministry of Health (MOH) & NEA Singapore guidelines for current PSI {regionData.psi} ({bandInfo.label})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: `${bandInfo.hex}18`,
              color: bandInfo.hex,
            }}
          >
            {bandInfo.label} Range ({bandInfo.range})
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Core Notice */}
        <div
          className="p-4 rounded-lg border text-xs"
          style={{
            backgroundColor: `${bandInfo.hex}0c`,
            borderColor: `${bandInfo.hex}30`,
          }}
        >
          <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" style={{ color: bandInfo.hex }} />
            <span>Health Summary for {regionData.displayName}:</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {bandInfo.summary} {bandInfo.generalPublicAdvice}
          </p>
        </div>

        {/* 4 Audience Specific Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Healthy Individuals */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Healthy Adults</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {psi <= 100
                  ? 'Normal daily activities and outdoor exercises can continue without restrictions.'
                  : psi <= 200
                  ? 'Reduce prolonged or strenuous outdoor physical exertion. Take frequent water breaks.'
                  : 'Avoid strenuous outdoor activities. Stay indoors with air purifiers where possible.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              {psi > 100 ? 'Take regular breaks' : 'No limitations'}
            </div>
          </div>

          {/* 2. Vulnerable Individuals */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-2">
                <HeartPulse className="w-4 h-4 text-slate-600" />
                <span>Elderly & Children</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {psi <= 50
                  ? 'Normal activities permitted.'
                  : psi <= 100
                  ? 'Monitor for breathing discomfort or irritation, especially during afternoon hours.'
                  : psi <= 200
                  ? 'Minimize outdoor activities. Keep windows closed and operate air conditioning/purifiers.'
                  : 'Strictly avoid outdoor exposure. Wear N95 respirator if stepping out for essential needs.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              {psi > 50 ? 'Monitor sensitive airways' : 'Unrestricted'}
            </div>
          </div>

          {/* 3. Outdoor Sports & Runners */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <span>Athletes & Runners</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {psi <= 50
                  ? 'Ideal conditions for marathons, road cycling, and high-intensity interval training.'
                  : psi <= 100
                  ? 'Safe for exercise, but check 1-hr PM2.5 levels prior to sprint sessions.'
                  : psi <= 200
                  ? 'Switch outdoor workouts to indoor gyms. Avoid open-air road cycling and distance runs.'
                  : 'Cancel all outdoor sports events. Intense respiration draws fine particles deep into lungs.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              {psi > 100 ? 'Switch to indoor gym' : 'Ideal conditions'}
            </div>
          </div>

          {/* 4. Outdoor Workers (MOM guidelines) */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-2">
                <HardHat className="w-4 h-4 text-slate-600" />
                <span>Outdoor Work (MOM)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {psi <= 100
                  ? 'Standard workplace operations with adequate hydration.'
                  : psi <= 200
                  ? 'Provide rest breaks every 45-60 min. Provide N95 masks for heavy physical labor.'
                  : 'Deploy certified N95 masks. Reassess non-essential outdoor work as per MOM guidelines.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              {psi > 100 ? 'MOM Haze Guidelines Apply' : 'Standard safety protocols'}
            </div>
          </div>
        </div>

        {/* N95 Mask & HEPA Air Purifier Advice Bar */}
        <div className="bg-slate-100 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold text-slate-900 mb-1">N95 Mask Guidelines</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Standard surgical and paper masks do not filter PM2.5 particulate matter. Use certified N95 respirators with a tight facial seal if outdoor exposure during Unhealthy or Hazardous haze is unavoidable. Not recommended for children or people with severe respiratory distress without doctor advice.
            </p>
          </div>
          <div>
            <div className="font-semibold text-slate-900 mb-1">Indoor Air Quality & Ventilation</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Keep external doors and windows closed when 1-hr PM2.5 is elevated. Run air-conditioning in recirculation mode and operate portable air cleaners equipped with true HEPA filters. Avoid smoking, frying, or lighting incense indoors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
