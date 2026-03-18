'use client';

import { useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';

export type MapMode = 'gap' | 'density' | 'trust';

export interface LGA {
  id: number;
  name: string;
  state: string;
  gap_score?: number;
  ngo_count_total?: number;
  ngo_count_verified?: number;
  dominant_trust_tier?: 'registered' | 'verified' | 'active' | 'accredited';
  [key: string]: unknown;
}

interface Props {
  lgas: LGA[];
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
  mapMode?: MapMode;
  geoJson?: GeoJsonObject | null;
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

const TRUST_COLOURS: Record<string, string> = {
  registered: '#3b82f6',
  verified:   '#8b5cf6',
  active:     '#10b981',
  accredited: '#f59e0b',
};

function GeoJsonLayer({ geoJson, lgaMap, filteredIds, mapMode, onSelectLga, onHoverLga }: {
  geoJson: GeoJsonObject;
  lgaMap: Map<string, LGA>;
  filteredIds: Set<number>;
  mapMode: MapMode;
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
}) {
  const map = useMap();
  const hoveredRef = useRef<string | null>(null);

  const styleFeature = useCallback((feature?: Feature) => {
    const name = (feature?.properties?.shapeName as string) ?? '';
    const lga  = lgaMap.get(norm(name));
    const isActive = lga ? filteredIds.has(lga.id) : false;

    let fillColor = '#e2e8f0';
    if (lga && isActive) {
      if (mapMode === 'gap')     fillColor = gapColour(lga.gap_score ?? 0);
      if (mapMode === 'density') fillColor = densityColour(lga.ngo_count_verified ?? 0);
      if (mapMode === 'trust')   fillColor = TRUST_COLOURS[lga.dominant_trust_tier ?? ''] ?? '#e2e8f0';
    }

    return { fillColor, fillOpacity: isActive ? 0.78 : 0.15, color: '#94a3b8', weight: 0.5, opacity: 0.6 } as L.PathOptions;
  }, [lgaMap, filteredIds, mapMode]);

  const onEachFeature = useCallback((feature: Feature, layer: L.Layer) => {
    const name = (feature.properties?.shapeName as string) ?? '';
    const lga  = lgaMap.get(norm(name));
    if (!lga) return;

    layer.on({
      mouseover(e: L.LeafletMouseEvent) {
        (e.target as L.Path).setStyle({ weight: 2, color: '#10b981', fillOpacity: 0.92 });
        (e.target as L.Path).bringToFront();
        if (hoveredRef.current !== lga.id.toString()) {
          hoveredRef.current = lga.id.toString();
          onHoverLga(lga);
        }
      },
      mouseout(e: L.LeafletMouseEvent) {
        (e.target as L.Path).setStyle(styleFeature(feature));
        hoveredRef.current = null;
        onHoverLga(null);
      },
      click(e: L.LeafletMouseEvent) {
        onSelectLga(lga);
        map.fitBounds((e.target as L.Polygon).getBounds(), { padding: [60, 60], maxZoom: 10 });
      },
    });
  }, [lgaMap, onHoverLga, onSelectLga, styleFeature, map]);

  return (
    <GeoJSON
      key={`${mapMode}`}
      data={geoJson}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}

export default function LeafletMap({ lgas, onSelectLga, onHoverLga, mapMode = 'gap', geoJson }: Props) {
  const lgaMap = new Map<string, LGA>();
  lgas.forEach(l => lgaMap.set(norm(l.name), l));
  const filteredIds = new Set(lgas.map(l => l.id));

  return (
    <MapContainer
      center={[9.082, 8.6753]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={14}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={14}
        pane="shadowPane"
      />
      <ZoomControl position="bottomright" />
      {geoJson && (
        <GeoJsonLayer
          geoJson={geoJson}
          lgaMap={lgaMap}
          filteredIds={filteredIds}
          mapMode={mapMode}
          onSelectLga={onSelectLga}
          onHoverLga={onHoverLga}
        />
      )}
    </MapContainer>
  );
}
