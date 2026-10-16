import React, { useEffect, useRef, useState } from 'react';
import { SingaporeRegion, RegionData, PSIResponse } from '../types/psi';
import { getBandDetails, getPM25Band, REGION_COORDINATES } from '../services/neaService';
import { Layers, MapPin, Wind, Info, Compass } from 'lucide-react';
import L from 'leaflet';

interface InteractiveMapProps {
  data: PSIResponse;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
  metricMode: 'psi' | 'pm25';
  onChangeMetric: (metric: 'psi' | 'pm25') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  metricMode,
  onChangeMetric,
}) => {
  const [mapEngine, setMapEngine] = useState<'svg' | 'leaflet'>('svg');
  const leafletMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize and update Leaflet map when active
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletMapRef.current) return;

    if (!mapInstanceRef.current) {
      // Singapore center coordinates: 1.3521° N, 103.8198° E
      const map = L.map(leafletMapRef.current, {
        center: [1.3521, 103.8198],
        zoom: 11,
        minZoom: 10,
        maxZoom: 14,
        zoomControl: true,
      });

      // CartoDB Positron clean map tiles (high contrast, ultra legible)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    } else {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    const markersGroup = markersGroupRef.current;
    if (markersGroup) {
      markersGroup.clearLayers();

      const regionsList: SingaporeRegion[] = ['north', 'south', 'east', 'west', 'central'];

      regionsList.forEach((reg) => {
        const regData = data.regions[reg];
        if (!regData) return;

        const val = metricMode === 'psi' ? regData.psi : regData.pm25_1h;
        const bandInfo = getBandDetails(regData.band);
        const hexColor = bandInfo.hex;
        const isSelected = selectedRegion === reg;

        // Create custom HTML marker
        const icon = L.divIcon({
          className: 'leaflet-psi-pin',
          html: `
            <div style="
              background-color: ${hexColor};
              width: ${isSelected ? '52px' : '44px'};
              height: ${isSelected ? '52px' : '44px'};
              border-radius: 50%;
              border: 3px solid ${isSelected ? '#0f172a' : '#ffffff'};
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              font-family: 'JetBrains Mono', monospace;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              <span style="font-size: 13px; font-weight: 700; line-height: 1;">${val}</span>
              <span style="font-size: 8px; font-weight: 500; opacity: 0.9; text-transform: uppercase;">${metricMode === 'psi' ? 'PSI' : 'PM2.5'}</span>
            </div>
          `,
          iconSize: [isSelected ? 52 : 44, isSelected ? 52 : 44],
          iconAnchor: [isSelected ? 26 : 22, isSelected ? 26 : 22],
        });

        const marker = L.marker([regData.coordinates.lat, regData.coordinates.lng], { icon });

        // Add soft radial air footprint circle
        const circle = L.circle([regData.coordinates.lat, regData.coordinates.lng], {
          radius: 4200,
          color: hexColor,
          fillColor: hexColor,
          fillOpacity: isSelected ? 0.25 : 0.12,
          weight: isSelected ? 2 : 1,
        });

        marker.on('click', () => {
          onSelectRegion(reg);
        });

        circle.on('click', () => {
          onSelectRegion(reg);
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${regData.displayName} Station</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${REGION_COORDINATES[reg].stationName}</div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span style="font-size: 20px; font-weight: 700; color: ${hexColor};">${regData.psi} PSI</span>
              <span style="font-size: 12px; font-weight: 600; color: ${hexColor};">${bandInfo.label}</span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">1-Hr PM2.5: ${regData.pm25_1h} µg/m³ · 24-Hr PM10: ${regData.pm10_24h} µg/m³</div>
          </div>
        `);

        markersGroup.addLayer(circle);
        markersGroup.addLayer(marker);
      });
    }

    return () => {
      // Keep map instance alive or clean up on unmount
    };
  }, [mapEngine, data, selectedRegion, metricMode, onSelectRegion]);

  // Clean up leaflet when switching engine
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const currentRegionData = data.regions[selectedRegion] || data.regions.national;
  const currentBandInfo = getBandDetails(currentRegionData.band);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Map Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Singapore Air Quality Map</h2>
            <span className="text-xs text-slate-500 font-mono">
              Updated {new Date(data.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a region on the map or list to inspect local NEA sensor stations and health guidelines.
          </p>
        </div>

        {/* Controls: Metric Toggle & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Metric Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => onChangeMetric('psi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                metricMode === 'psi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24-Hr PSI
            </button>
            <button
              onClick={() => onChangeMetric('pm25')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                metricMode === 'pm25'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Hr PM2.5 (µg/m³)
            </button>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setMapEngine('svg')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                mapEngine === 'svg'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-slate-600" />
              Regional Map
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                mapEngine === 'leaflet'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              Satellite / Street
            </button>
          </div>
        </div>
      </div>

      {/* Town & Neighborhood Quick Finder Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Quick Town Filter:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { town: 'Jurong / Tuas', region: 'west' as const },
            { town: 'Woodlands / Yishun', region: 'north' as const },
            { town: 'Bishan / Ang Mo Kio', region: 'central' as const },
            { town: 'Tampines / Changi', region: 'east' as const },
            { town: 'Marina Bay / CBD', region: 'south' as const },
            { town: 'Islandwide (National)', region: 'national' as const },
          ].map((item) => (
            <button
              key={item.town}
              onClick={() => onSelectRegion(item.region)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedRegion === item.region
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.town}
            </button>
          ))}
        </div>
      </div>

      {/* Map Viewport Area */}
      <div className="relative w-full h-[430px] sm:h-[490px] bg-slate-50 overflow-hidden">
        {mapEngine === 'svg' ? (
          <div className="w-full h-full relative flex items-center justify-center p-4">
            {/* SVG Singapore Regional Schematic Map */}
            <svg
              viewBox="0 0 920 540"
              className="w-full h-full max-h-[460px] select-none"
              style={{ filter: 'drop-shadow(0 6px 16px rgba(15, 23, 42, 0.06))' }}
            >
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                </pattern>
                <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* Subtle background sea grid */}
              <rect width="100%" height="100%" fill="url(#gridPattern)" opacity="0.6" />

              {/* Waterway indicators (Johor Strait & Singapore Strait) */}
              <text x="500" y="40" className="text-[12px] fill-slate-300 font-sans tracking-widest uppercase">
                Johor Strait (Malaysia)
              </text>
              <text x="440" y="520" className="text-[12px] fill-slate-300 font-sans tracking-widest uppercase">
                Singapore Strait
              </text>

              {/* Islands: Pulau Ubin & Tekong */}
              <g className="cursor-pointer" onClick={() => onSelectRegion('east')}>
                <path
                  d="M 680 150 Q 720 140 760 160 Q 750 185 710 180 Q 670 170 680 150 Z"
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <text x="705" y="166" className="text-[10px] fill-slate-500 font-medium">Pulau Ubin</text>
              </g>

              {/* Jurong Island */}
              <g className="cursor-pointer" onClick={() => onSelectRegion('west')}>
                <path
                  d="M 230 400 Q 280 395 310 420 Q 295 460 250 455 Q 215 440 230 400 Z"
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <text x="245" y="430" className="text-[10px] fill-slate-500 font-medium">Jurong Island</text>
              </g>

              {/* Sentosa */}
              <g className="cursor-pointer" onClick={() => onSelectRegion('south')}>
                <path
                  d="M 430 460 Q 480 460 500 480 Q 460 495 425 480 Z"
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <text x="448" y="476" className="text-[10px] fill-slate-500 font-medium">Sentosa</text>
              </g>

              {/* REGION: WEST (Jurong, Tuas, Bukit Batok, Clementi) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion('west')}
              >
                <path
                  d="M 90 280 C 130 200 230 180 320 220 L 330 330 C 310 390 240 400 180 380 C 120 370 70 330 90 280 Z"
                  fill={selectedRegion === 'west' ? '#ecfdf5' : '#ffffff'}
                  stroke={selectedRegion === 'west' ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={selectedRegion === 'west' ? '2.5' : '1.5'}
                />
              </g>

              {/* REGION: NORTH (Woodlands, Yishun, Sembawang, Lim Chu Kang) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion('north')}
              >
                <path
                  d="M 320 220 C 310 140 430 70 540 100 C 560 160 520 210 450 220 L 320 220 Z"
                  fill={selectedRegion === 'north' ? '#ecfdf5' : '#ffffff'}
                  stroke={selectedRegion === 'north' ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={selectedRegion === 'north' ? '2.5' : '1.5'}
                />
              </g>

              {/* REGION: CENTRAL (Bishan, Toa Payoh, Ang Mo Kio, Novena) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion('central')}
              >
                <path
                  d="M 330 220 L 450 220 C 520 230 520 300 480 340 L 380 340 L 330 330 Z"
                  fill={selectedRegion === 'central' ? '#ecfdf5' : '#ffffff'}
                  stroke={selectedRegion === 'central' ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={selectedRegion === 'central' ? '2.5' : '1.5'}
                />
              </g>

              {/* REGION: EAST (Tampines, Bedok, Changi, Pasir Ris) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion('east')}
              >
                <path
                  d="M 540 100 C 650 110 820 180 840 260 C 830 320 730 370 610 360 C 560 360 500 320 500 240 C 500 170 520 140 540 100 Z"
                  fill={selectedRegion === 'east' ? '#ecfdf5' : '#ffffff'}
                  stroke={selectedRegion === 'east' ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={selectedRegion === 'east' ? '2.5' : '1.5'}
                />
              </g>

              {/* REGION: SOUTH (Marina Bay, Telok Blangah, Bukit Merah, CBD) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectRegion('south')}
              >
                <path
                  d="M 330 330 L 380 340 L 480 340 C 540 340 610 360 590 410 C 540 450 440 450 380 430 C 340 410 320 380 330 330 Z"
                  fill={selectedRegion === 'south' ? '#ecfdf5' : '#ffffff'}
                  stroke={selectedRegion === 'south' ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={selectedRegion === 'south' ? '2.5' : '1.5'}
                />
              </g>

              {/* SENSOR PIN POINTS & LABELS */}
              {/* West Sensor */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectRegion('west')}
                transform="translate(220, 290)"
              >
                <circle
                  r={selectedRegion === 'west' ? '28' : '24'}
                  fill={getBandDetails(data.regions.west.band).hex}
                  stroke={selectedRegion === 'west' ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedRegion === 'west' ? '3' : '2'}
                  filter="url(#softGlow)"
                />
                <text textAnchor="middle" y="4" fill="#ffffff" className="font-mono text-[14px] font-bold">
                  {metricMode === 'psi' ? data.regions.west.psi : data.regions.west.pm25_1h}
                </text>
                <text textAnchor="middle" y="40" fill="#0f172a" className="font-sans text-[12px] font-semibold">
                  WEST
                </text>
                <text textAnchor="middle" y="53" fill="#64748b" className="font-sans text-[10px]">
                  Jurong
                </text>
              </g>

              {/* North Sensor */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectRegion('north')}
                transform="translate(430, 160)"
              >
                <circle
                  r={selectedRegion === 'north' ? '28' : '24'}
                  fill={getBandDetails(data.regions.north.band).hex}
                  stroke={selectedRegion === 'north' ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedRegion === 'north' ? '3' : '2'}
                  filter="url(#softGlow)"
                />
                <text textAnchor="middle" y="4" fill="#ffffff" className="font-mono text-[14px] font-bold">
                  {metricMode === 'psi' ? data.regions.north.psi : data.regions.north.pm25_1h}
                </text>
                <text textAnchor="middle" y="-34" fill="#0f172a" className="font-sans text-[12px] font-semibold">
                  NORTH
                </text>
                <text textAnchor="middle" y="-21" fill="#64748b" className="font-sans text-[10px]">
                  Woodlands
                </text>
              </g>

              {/* Central Sensor */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectRegion('central')}
                transform="translate(420, 275)"
              >
                <circle
                  r={selectedRegion === 'central' ? '28' : '24'}
                  fill={getBandDetails(data.regions.central.band).hex}
                  stroke={selectedRegion === 'central' ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedRegion === 'central' ? '3' : '2'}
                  filter="url(#softGlow)"
                />
                <text textAnchor="middle" y="4" fill="#ffffff" className="font-mono text-[14px] font-bold">
                  {metricMode === 'psi' ? data.regions.central.psi : data.regions.central.pm25_1h}
                </text>
                <text textAnchor="middle" y="40" fill="#0f172a" className="font-sans text-[12px] font-semibold">
                  CENTRAL
                </text>
                <text textAnchor="middle" y="53" fill="#64748b" className="font-sans text-[10px]">
                  Bishan
                </text>
              </g>

              {/* East Sensor */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectRegion('east')}
                transform="translate(680, 250)"
              >
                <circle
                  r={selectedRegion === 'east' ? '28' : '24'}
                  fill={getBandDetails(data.regions.east.band).hex}
                  stroke={selectedRegion === 'east' ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedRegion === 'east' ? '3' : '2'}
                  filter="url(#softGlow)"
                />
                <text textAnchor="middle" y="4" fill="#ffffff" className="font-mono text-[14px] font-bold">
                  {metricMode === 'psi' ? data.regions.east.psi : data.regions.east.pm25_1h}
                </text>
                <text textAnchor="middle" y="40" fill="#0f172a" className="font-sans text-[12px] font-semibold">
                  EAST
                </text>
                <text textAnchor="middle" y="53" fill="#64748b" className="font-sans text-[10px]">
                  Changi / Bedok
                </text>
              </g>

              {/* South Sensor */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectRegion('south')}
                transform="translate(460, 395)"
              >
                <circle
                  r={selectedRegion === 'south' ? '28' : '24'}
                  fill={getBandDetails(data.regions.south.band).hex}
                  stroke={selectedRegion === 'south' ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedRegion === 'south' ? '3' : '2'}
                  filter="url(#softGlow)"
                />
                <text textAnchor="middle" y="4" fill="#ffffff" className="font-mono text-[14px] font-bold">
                  {metricMode === 'psi' ? data.regions.south.psi : data.regions.south.pm25_1h}
                </text>
                <text textAnchor="middle" y="40" fill="#0f172a" className="font-sans text-[12px] font-semibold">
                  SOUTH
                </text>
                <text textAnchor="middle" y="53" fill="#64748b" className="font-sans text-[10px]">
                  Marina / CBD
                </text>
              </g>
            </svg>
          </div>
        ) : (
          <div ref={leafletMapRef} className="w-full h-full" />
        )}

        {/* Selected Region Hover / Float Card */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3 shadow-md max-w-[240px] pointer-events-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Selected Region:</span>
            <span className="font-semibold text-slate-900 capitalize">{currentRegionData.displayName}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-bold font-mono tracking-tight"
              style={{ color: currentBandInfo.hex }}
            >
              {metricMode === 'psi' ? currentRegionData.psi : currentRegionData.pm25_1h}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {metricMode === 'psi' ? 'PSI' : 'µg/m³ PM2.5'}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: `${currentBandInfo.hex}18`,
                color: currentBandInfo.hex,
              }}
            >
              {currentBandInfo.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            {currentBandInfo.summary}
          </div>
        </div>

        {/* Live Wind & Transboundary Haze Indicator */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3 shadow-md text-xs pointer-events-auto flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              Wind: {data.weatherSummary.windDirection}
            </div>
            <div className="text-slate-500 text-[11px]">
              {data.weatherSummary.windSpeedKmH} km/h · Regional Hotspots: {data.weatherSummary.hotspotsSumatra}
            </div>
          </div>
        </div>
      </div>

      {/* Official Singapore NEA Air Quality Index Legend Bar */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Singapore NEA Air Quality Scale (24-Hour PSI):</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">National Standard</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-800 mb-1">
              <span>Good</span>
              <span className="font-mono text-[11px]">0 – 50</span>
            </div>
            <div className="h-1.5 w-full bg-emerald-500 rounded-full mb-1.5" />
            <span className="text-[11px] text-slate-500 leading-tight">Normal activities</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-medium text-blue-800 mb-1">
              <span>Moderate</span>
              <span className="font-mono text-[11px]">51 – 100</span>
            </div>
            <div className="h-1.5 w-full bg-blue-500 rounded-full mb-1.5" />
            <span className="text-[11px] text-slate-500 leading-tight">Acceptable quality</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-medium text-amber-800 mb-1">
              <span>Unhealthy</span>
              <span className="font-mono text-[11px]">101 – 200</span>
            </div>
            <div className="h-1.5 w-full bg-amber-500 rounded-full mb-1.5" />
            <span className="text-[11px] text-slate-500 leading-tight">Reduce strenuous exertion</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-medium text-rose-800 mb-1">
              <span>Very Unhealthy</span>
              <span className="font-mono text-[11px]">201 – 300</span>
            </div>
            <div className="h-1.5 w-full bg-rose-500 rounded-full mb-1.5" />
            <span className="text-[11px] text-slate-500 leading-tight">Avoid outdoor activity</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs font-medium text-red-900 mb-1">
              <span>Hazardous</span>
              <span className="font-mono text-[11px]">&gt; 300</span>
            </div>
            <div className="h-1.5 w-full bg-red-800 rounded-full mb-1.5" />
            <span className="text-[11px] text-slate-500 leading-tight">Emergency conditions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
