'use client';

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, GeoJsonObject } from 'geojson';

export type MapMode = 'gap' | 'density' | 'trust' | 'funding';

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
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
  mapMode?: MapMode;
  view?: 'national' | 'lga';
  geoJson?: GeoJsonObject | null;
  stateGeoJson?: GeoJsonObject | null;
  isMobile?: boolean;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function gapColour(score: number): string {
  if (score >= 0.8)  return '#7f1d1d';
  if (score >= 0.6)  return '#b91c1c';
  if (score >= 0.45) return '#ef4444';
  if (score >= 0.3)  return '#f97316';
  if (score >= 0.15) return '#eab308';
  return '#22c55e';
}

function densityColour(count: number): string {
  if (count >= 30) return '#064e3b';
  if (count >= 20) return '#065f46';
  if (count >= 12) return '#047857';
  if (count >= 7)  return '#059669';
  if (count >= 3)  return '#10b981';
  if (count >= 1)  return '#6ee7b7';
  return '#f1f5f9';
}

function fundingColour(amount: number): string {
  if (amount >= 1000000) return '#1e3a8a'; // Very High (Blue 900)
  if (amount >= 500000)  return '#2563eb'; // High (Blue 600)
  if (amount >= 100000)  return '#60a5fa'; // Mid (Blue 400)
  if (amount >= 10000)   return '#dbeafe'; // Low (Blue 100)
  return '#f1f5f9'; // None (Slate 100)
}

const TRUST_COLOURS: Record<string, string> = {
  registered: '#3b82f6',
  verified:   '#8b5cf6',
  active:     '#10b981',
  accredited: '#f59e0b',
};

function GeoJsonLayer({ 
  geoJson, 
  stateGeoJson,
  lgaMap, 
  filteredIds, 
  mapMode, 
  view = 'national',
  onSelectLga, 
  onHoverLga 
}: {
  geoJson: GeoJsonObject;
  stateGeoJson?: GeoJsonObject | null;
  lgaMap: Map<string, LGA>;
  filteredIds: Set<number>;
  mapMode: MapMode;
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
      d.count += lga.ngo_count_verified ?? 0;
      d.funding += lga.total_funding_usd ?? 0;
      d.lgas += 1;
    });
    return states;
  }, [lgaMap]);

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
        if (mapMode === 'gap') {
          const avgGap = data.gap.reduce((a, b) => a + b, 0) / data.gap.length;
          fillColor = gapColour(avgGap);
        } else if (mapMode === 'density') {
          fillColor = densityColour(data.count / data.lgas);
        } else if (mapMode === 'funding') {
          fillColor = fundingColour(data.funding);
        }
      }
    } else {
      const name = (feature?.properties?.LGA as string) || (feature?.properties?.name as string) || (feature?.properties?.shapeName as string) || '';
      const lga  = lgaMap.get(norm(name));
      const isActive = lga ? filteredIds.has(lga.id) : false;

      if (lga && isActive) {
        fillOpacity = 0.78;
        if (mapMode === 'gap')     fillColor = gapColour(lga.gap_score ?? 0);
        if (mapMode === 'density') fillColor = densityColour(lga.ngo_count_verified ?? 0);
        if (mapMode === 'trust')   fillColor = TRUST_COLOURS[lga.dominant_trust_tier ?? ''] ?? '#e2e8f0';
        if (mapMode === 'funding') fillColor = fundingColour(lga.total_funding_usd ?? 0);
      }
    }

    return { fillColor, fillOpacity, color: '#94a3b8', weight: 0.5, opacity: 0.6 } as L.PathOptions;
  }, [lgaMap, filteredIds, mapMode, view, stateData]);

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

export default function LeafletMap({ 
  lgas, 
  onSelectLga, 
  onHoverLga, 
  mapMode = 'gap', 
  view = 'national',
  geoJson, 
  stateGeoJson,
  isMobile 
}: Props) {
  const lgaMap = useMemo(() => {
    const map = new Map<string, LGA>();
    lgas.forEach(l => map.set(norm(l.name), l));
    return map;
  }, [lgas]);

  const filteredIds = useMemo(() => new Set(lgas.map(l => l.id)), [lgas]);

  return (
    <MapContainer
      center={[9.082, 8.6753]}
      zoom={6}
      style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      className="subtle-map"
      zoomControl={false}
      attributionControl={false}
    >
      <ZoomControl position="bottomright" />
      <GeoJsonLayer
        geoJson={geoJson as any}
        stateGeoJson={stateGeoJson}
        lgaMap={lgaMap}
        filteredIds={filteredIds}
        mapMode={mapMode}
        view={view}
        onSelectLga={onSelectLga}
        onHoverLga={onHoverLga}
      />
    </MapContainer>
  );
}
