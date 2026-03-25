'use client';

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, GeoJsonObject } from 'geojson';
import { getPriorityColor, getCapacityColor, TRUST_COLOURS, MapMode } from '@/lib/map-utils';

export interface LGA {
  id: number;
  name: string;
  state: string;
  gap_score?: number;
  ngo_count_total?: number;
  ngo_count_verified?: number;
  total_funding_usd?: number;
  dominant_trust_tier?: 'registered' | 'verified' | 'active' | 'accredited';
  [key: string]: unknown;
}

interface Props {
  lgas: LGA[];
  programmes: any[];
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
  onViewChange?: (view: 'national' | 'lga') => void;
  mapMode?: MapMode;
  capacityType?: 'ngos' | 'programmes';
  verifiedOnly?: boolean;
  view?: 'national' | 'lga';
  geoJson?: GeoJsonObject | null;
  stateGeoJson?: GeoJsonObject | null;
  isMobile?: boolean;
  selectedState?: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function GeoJsonLayer({ 
  geoJson, 
  stateGeoJson,
  lgaMap, 
  programmes,
  filteredIds, 
  mapMode, 
  capacityType = 'ngos',
  verifiedOnly = true,
  view = 'national',
  onSelectLga, 
  onHoverLga 
}: {
  geoJson: GeoJsonObject;
  stateGeoJson?: GeoJsonObject | null;
  lgaMap: Map<string, LGA>;
  programmes: any[];
  filteredIds: Set<number>;
  mapMode: MapMode;
  capacityType?: 'ngos' | 'programmes';
  verifiedOnly?: boolean;
  view?: 'national' | 'lga';
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
}) {
  const map = useMap();

  // Aggregate data to state level
  const stateData = useMemo(() => {
    const states = new Map<string, { gap: number[], count: number, funding: number, lgas: number }>();
    lgaMap.forEach(lga => {
      const s = lga.state;
      if (!states.has(s)) states.set(s, { gap: [], count: 0, funding: 0, lgas: 0 });
      const d = states.get(s)!;
      d.gap.push(lga.gap_score ?? 0);
      
      if (mapMode === 'capacity') {
        if (capacityType === 'ngos') {
          d.count += verifiedOnly ? (lga.ngo_count_verified ?? 0) : (lga.ngo_count_total ?? 0);
        } else {
          // Count programmes for this LGA
          const lgaProgs = programmes.filter(p => p.lga_id === lga.id);
          d.count += lgaProgs.length;
        }
      }
      
      d.funding += lga.total_funding_usd ?? 0;
      d.lgas += 1;
    });
    return states;
  }, [lgaMap, mapMode, capacityType, verifiedOnly, programmes]);

  const stateOverlayStyle = {
    color: '#475569',
    weight: 1.5,
    opacity: 0.4,
    fillOpacity: 0,
    interactive: false
  };

  useEffect(() => {
    const STATE_LABELS: [number, number, string][] = [
      [7.524724, 5.430890, 'Abia'],
      [12.438058, 9.325049, 'Adamawa'],
      [7.872159, 4.929986, 'Akwa Ibom'],
      [7.006839, 6.275765, 'Anambra'],
      [9.844166, 10.315830, 'Bauchi'],
      [5.898713, 4.867776, 'Bayelsa'],
      [8.836275, 7.350820, 'Benue'],
      [13.151, 11.833, 'Borno'],
      [8.327, 5.960, 'Cross River'],
      [5.679, 5.686, 'Delta'],
      [6.136, 6.718, 'Ebonyi'],
      [6.338, 6.348, 'Edo'],
      [5.221, 7.719, 'Ekiti'],
      [7.510, 6.460, 'Enugu'],
      [10.653, 10.452, 'Gombe'],
      [7.026, 5.487, 'Imo'],
      [9.561, 11.745, 'Jigawa'],
      [7.877, 10.536, 'Kaduna'],
      [8.592, 11.948, 'Kano'],
      [7.610, 12.380, 'Katsina'],
      [4.197, 11.313, 'Kebbi'],
      [6.750, 7.799, 'Kogi'],
      [4.841, 8.500, 'Kwara'],
      [3.379, 6.524, 'Lagos'],
      [8.519, 8.918, 'Nasarawa'],
      [6.548, 9.981, 'Niger'],
      [3.947, 7.003, 'Ogun'],
      [5.208, 7.250, 'Ondo'],
      [4.561, 7.563, 'Osun'],
      [3.947, 7.855, 'Oyo'],
      [8.894, 9.218, 'Plateau'],
      [7.049, 4.772, 'Rivers'],
      [5.233, 12.917, 'Sokoto'],
      [11.333, 8.000, 'Taraba'],
      [11.833, 12.000, 'Yobe'],
      [6.235, 12.170, 'Zamfara'],
      [7.491, 9.057, 'FCT'],
    ];

    const markers: L.Marker[] = [];

    if (view === 'national') {
      STATE_LABELS.forEach(([lng, lat, name]) => {
        const icon = L.divIcon({
          className: '',
          html: `<span style="
            font-family: 'DM Sans', system-ui, sans-serif;
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
            text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff;
          ">${name}</span>`,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([lat, lng], {
          icon,
          interactive: false,
          zIndexOffset: -1000,
        }).addTo(map);

        markers.push(marker);
      });
    }

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [map, view]);

  const hoveredRef = useRef<string | null>(null);

  const styleFeature = useCallback((feature?: Feature) => {
    let fillColor = '#e2e8f0';
    let fillOpacity = 0.15;

    if (view === 'national') {
      const stateName = feature?.properties?.NAME_1 || feature?.properties?.name || feature?.properties?.state;
      const data = stateData.get(stateName);
      if (data) {
        fillOpacity = 0.78;
        if (mapMode === 'priority') {
          const avgGap = data.gap.reduce((a, b) => a + b, 0) / data.gap.length;
          fillColor = getPriorityColor(avgGap, data.funding / data.lgas);
        } else if (mapMode === 'capacity') {
          fillColor = getCapacityColor(data.count / data.lgas);
        }
      }
    } else {
      const name = (feature?.properties?.LGA as string) || (feature?.properties?.name as string) || (feature?.properties?.shapeName as string) || '';
      const lga  = lgaMap.get(norm(name));
      const isActive = lga ? filteredIds.has(lga.id) : false;

      if (lga && isActive) {
        fillOpacity = 0.78;
        if (mapMode === 'priority') {
          fillColor = getPriorityColor(lga.gap_score ?? 0, lga.total_funding_usd ?? 0);
        } else if (mapMode === 'capacity') {
          if (capacityType === 'ngos') {
            fillColor = getCapacityColor(verifiedOnly ? (lga.ngo_count_verified ?? 0) : (lga.ngo_count_total ?? 0));
          } else {
            const lgaProgs = programmes.filter(p => p.lga_id === lga.id);
            fillColor = getCapacityColor(lgaProgs.length);
          }
        }
      }
    }

    return { fillColor, fillOpacity, color: '#94a3b8', weight: 0.5, opacity: 0.6 } as L.PathOptions;
  }, [lgaMap, filteredIds, mapMode, view, stateData, capacityType, verifiedOnly, programmes]);

  const onEachFeature = useCallback((feature: Feature, layer: L.Layer) => {
    layer.on({
      mouseover(e: L.LeafletMouseEvent) {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        (e.target as L.Path).setStyle({ weight: 2, color: '#10b981', fillOpacity: 0.92 });
        (e.target as L.Path).bringToFront();
        
        if (view === 'lga') {
          const name = (feature.properties?.LGA as string) || (feature.properties?.name as string) || (feature.properties?.shapeName as string) || '';
          const lga  = lgaMap.get(norm(name));
          if (lga && hoveredRef.current !== lga.id.toString()) {
            hoveredRef.current = lga.id.toString();
            onHoverLga(lga);
          }
        }
      },
      mouseout(e: L.LeafletMouseEvent) {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        (e.target as L.Path).setStyle(styleFeature(feature));
        hoveredRef.current = null;
        onHoverLga(null);
      },
      click(e: L.LeafletMouseEvent) {
        if (view === 'national') {
          const stateName = feature.properties?.NAME_1 || feature.properties?.name || feature.properties?.state;
          // We pass a dummy LGA object with the state name so the parent can handle the zoom/view switch
          onSelectLga({ state: stateName } as any);
        } else {
          const name = (feature.properties?.LGA as string) || (feature.properties?.name as string) || (feature.properties?.shapeName as string) || '';
          const lga  = lgaMap.get(norm(name));
          if (lga) onSelectLga(lga);
        }
      },
    });
  }, [lgaMap, onHoverLga, onSelectLga, styleFeature, view]);

  return (
    <>
      {/* State Overlay - Always visible in LGA view for context */}
      {view === 'lga' && stateGeoJson && (
        <GeoJSON
          key="state-overlay"
          data={stateGeoJson}
          style={stateOverlayStyle}
        />
      )}

      {view === 'national' && stateGeoJson && (
        <GeoJSON
          key={`national-${mapMode}`}
          data={stateGeoJson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}
      {view === 'lga' && geoJson && (
        <GeoJSON
          key={`lga-${mapMode}`}
          data={geoJson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
}

function ZoomHandler({ onViewChange, view }: { onViewChange?: (view: 'national' | 'lga') => void, view: 'national' | 'lga' }) {
  const map = useMap();
  useEffect(() => {
    if (!onViewChange) return;
    const handleZoom = () => {
      const zoom = map.getZoom();
      const newView = zoom >= 8 ? 'lga' : 'national';
      if (newView !== view) {
        onViewChange(newView);
      }
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, view, onViewChange]);
  return null;
}

function MapController({ selectedState, stateGeoJson, view }: { selectedState?: string, stateGeoJson?: GeoJsonObject | null, view: string }) {
  const map = useMap();
  useEffect(() => {
    if (selectedState && stateGeoJson && view === 'lga') {
       const features = (stateGeoJson as any).features;
       const feature = features.find((f: any) => {
         const name = f.properties?.NAME_1 || f.properties?.name || f.properties?.state;
         return name === selectedState;
       });
       if (feature) {
         const bounds = L.geoJSON(feature).getBounds();
         map.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
       }
    }
  }, [selectedState, stateGeoJson, view, map]);
  return null;
}

export default function LeafletMap({ 
  lgas,
  programmes,
  onSelectLga, 
  onHoverLga, 
  onViewChange,
  mapMode = 'priority',
  capacityType = 'ngos',
  verifiedOnly = true,
  view = 'national',
  geoJson, 
  stateGeoJson,
  isMobile,
  selectedState
}: Props) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredData, setHoveredData] = useState<{ name: string; state?: string; value: string | number } | null>(null);

  const lgaMap = useMemo(() => {
    const map = new Map<string, LGA>();
    lgas.forEach(l => map.set(norm(l.name), l));
    return map;
  }, [lgas]);

  const filteredIds = useMemo(() => new Set(lgas.map(l => l.id)), [lgas]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full h-full relative" onMouseMove={handleMouseMove}>
      <MapContainer
        center={[9.082, 8.6753]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        className="subtle-map"
        zoomControl={false}
        attributionControl={false}
      >
        <ZoomControl position="bottomright" />
        <ZoomHandler onViewChange={onViewChange} view={view} />
        <MapController selectedState={selectedState} stateGeoJson={stateGeoJson} view={view} />
        <GeoJsonLayer
          geoJson={geoJson as any}
          stateGeoJson={stateGeoJson}
          lgaMap={lgaMap}
          programmes={programmes}
          filteredIds={filteredIds}
          mapMode={mapMode as MapMode}
          capacityType={capacityType}
          verifiedOnly={verifiedOnly}
          view={view}
          onSelectLga={onSelectLga}
          onHoverLga={(lga) => {
            onHoverLga(lga);
            if (!lga) {
              setHoveredData(null);
              return;
            }
            let value: string | number = '';
            if (mapMode === 'priority') {
              value = `${((lga.gap_score || 0) * 100).toFixed(0)}% Need`;
            } else if (mapMode === 'capacity') {
              if (capacityType === 'ngos') {
                value = `${verifiedOnly ? (lga.ngo_count_verified || 0) : (lga.ngo_count_total || 0)} NGOs`;
              } else {
                const lgaProgs = programmes.filter(p => p.lga_id === lga.id);
                value = `${lgaProgs.length} Programmes`;
              }
            }
            
            setHoveredData({ name: lga.name, state: lga.state, value });
          }}
        />
      </MapContainer>

      {/* Cursor Tooltip (Ghost) */}
      {hoveredData && !isMobile && (
        <div 
          className="fixed z-[2000] pointer-events-none bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 flex flex-col gap-0.5"
          style={{ 
            left: mousePos.x + 20, 
            top: mousePos.y - 20,
            transform: 'translate(0, -50%)'
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none">
            {hoveredData.state ? `${hoveredData.state} / ` : ''}{view === 'national' ? 'State' : 'LGA'}
          </div>
          <div className="text-sm font-bold leading-tight">{hoveredData.name}</div>
          <div className="text-xs font-mono opacity-80 mt-1">
            {mapMode === 'capacity' ? 'Capacity: ' : 'Priority: '}
            <span className="text-white font-bold">{hoveredData.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
