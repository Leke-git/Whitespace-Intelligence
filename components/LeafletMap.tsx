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
  mapMode?: MapMode;
  capacityType?: 'ngos' | 'programmes';
  verifiedOnly?: boolean;
  geoJson?: GeoJsonObject | null;
  stateGeoJson?: GeoJsonObject | null;
  isMobile?: boolean;
  selectedState?: string;
  drawerOpen?: boolean;
}

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/ state$/i, '').replace(/[^a-z0-9]/g, '');
}

function GeoJsonLayer({ 
  geoJson, 
  stateGeoJson,
  lgas,
  lgaMap, 
  programmes,
  filteredIds, 
  mapMode, 
  capacityType = 'ngos',
  verifiedOnly = true,
  onSelectLga, 
  onHoverLga 
}: {
  geoJson: GeoJsonObject;
  stateGeoJson?: GeoJsonObject | null;
  lgas: LGA[];
  lgaMap: Map<string, LGA>;
  programmes: any[];
  filteredIds: Set<number>;
  mapMode: MapMode;
  capacityType?: 'ngos' | 'programmes';
  verifiedOnly?: boolean;
  onSelectLga: (lga: LGA | null) => void;
  onHoverLga: (lga: LGA | null) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  const stateOverlayStyle = useMemo(() => ({
    color: '#1e293b',
    weight: zoom > 8 ? 2.0 : 1.2,
    opacity: zoom > 8 ? 0.8 : 0.5,
    fillOpacity: 0,
    interactive: false
  }), [zoom]);

  const hoveredRef = useRef<string | null>(null);

  const styleFeature = useCallback((feature?: Feature) => {
    let fillColor = '#cbd5e1';
    let fillOpacity = 0.45;

    const name = (feature?.properties?.LGA as string) || (feature?.properties?.name as string) || (feature?.properties?.shapeName as string) || '';
    const lga  = lgaMap.get(norm(name));
    const isActive = lga ? filteredIds.has(lga.id) : false;

    if (lga && isActive) {
      fillOpacity = 0.85;
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

    return { 
      fillColor, 
      fillOpacity, 
      color: '#334155', 
      weight: zoom > 8 ? 1.5 : 0.8, 
      opacity: zoom > 8 ? 1.0 : 0.6,
      pane: 'overlayPane'
    } as L.PathOptions;
  }, [lgaMap, filteredIds, mapMode, capacityType, verifiedOnly, programmes, zoom]);

  const onEachFeature = useCallback((feature: Feature, layer: L.Layer) => {
    layer.on({
      mouseover(e: L.LeafletMouseEvent) {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        (e.target as L.Path).setStyle({ weight: 2, color: '#10b981', fillOpacity: 0.92 });
        (e.target as L.Path).bringToFront();
        
        const name = (feature.properties?.LGA as string) || (feature.properties?.name as string) || (feature.properties?.shapeName as string) || '';
        const lga  = lgaMap.get(norm(name));
        if (lga && hoveredRef.current !== lga.id.toString()) {
          hoveredRef.current = lga.id.toString();
          onHoverLga(lga);
        }
      },
      mouseout(e: L.LeafletMouseEvent) {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        (e.target as L.Path).setStyle(styleFeature(feature));
        hoveredRef.current = null;
        onHoverLga(null);
      },
      click(e: L.LeafletMouseEvent) {
        const name = (feature.properties?.LGA as string) || (feature.properties?.name as string) || (feature.properties?.shapeName as string) || '';
        const lga  = lgaMap.get(norm(name));
        if (lga) {
          onSelectLga(lga);
          map.fitBounds((e.target as L.Path).getBounds(), { padding: [100, 100], maxZoom: 12 });
        }
      },
    });
  }, [lgaMap, onHoverLga, onSelectLga, styleFeature, map]);

  return (
    <>
      {/* State Overlay - Always visible for context */}
      {stateGeoJson && (
        <GeoJSON
          key="state-overlay"
          data={stateGeoJson}
          style={stateOverlayStyle}
        />
      )}

      {geoJson && (
        <GeoJSON
          key={`lga-${mapMode}-${geoJson ? 'loaded' : 'loading'}`}
          data={geoJson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
}

function MapController({ selectedState, stateGeoJson, drawerOpen, isMobile, nigeriaBounds }: { selectedState?: string, stateGeoJson?: GeoJsonObject | null, drawerOpen?: boolean, isMobile?: boolean, nigeriaBounds: L.LatLngBounds }) {
  const map = useMap();
  const initialFitRef = useRef(false);
  
  useEffect(() => {
    if (isMobile && !selectedState && !initialFitRef.current) {
      map.fitBounds(nigeriaBounds, { padding: [20, 20] });
      initialFitRef.current = true;
    }
  }, [isMobile, map, nigeriaBounds, selectedState]);

  useEffect(() => {
    if (selectedState && stateGeoJson) {
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
  }, [selectedState, stateGeoJson, map]);

  useEffect(() => {
    if (drawerOpen && !isMobile) {
      map.panBy([-100, 0], { animate: true, duration: 0.5 });
    } else if (!drawerOpen && !isMobile) {
      // No easy way to "unpan" accurately without storing original center, 
      // but usually the user will interact anyway.
    }
  }, [drawerOpen, isMobile, map]);

  return null;
}

export default function LeafletMap({ 
  lgas,
  programmes,
  onSelectLga, 
  onHoverLga, 
  mapMode = 'priority',
  capacityType = 'ngos',
  verifiedOnly = true,
  geoJson, 
  stateGeoJson,
  isMobile,
  selectedState,
  drawerOpen
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

  const mapKey = useMemo(() => {
    return `lga-${lgas.length}-${stateGeoJson ? 's' : 'no-s'}-${geoJson ? 'l' : 'no-l'}`;
  }, [lgas.length, stateGeoJson, geoJson]);

  const nigeriaBounds = useMemo(() => {
    return L.latLngBounds(
      L.latLng(4.0, 2.5), // Southwest corner
      L.latLng(14.0, 15.0) // Northeast corner
    );
  }, []);

  return (
    <div className="w-full h-full relative" onMouseMove={handleMouseMove}>
      <MapContainer
        key={mapKey}
        center={[9.082, 8.6753]}
        zoom={isMobile ? 5 : 6}
        minZoom={isMobile ? 5 : 6}
        maxBounds={nigeriaBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        className="subtle-map"
        zoomControl={false}
        attributionControl={false}
      >
        {!isMobile && <ZoomControl position="topright" />}
        <MapController 
          selectedState={selectedState} 
          stateGeoJson={stateGeoJson} 
          drawerOpen={drawerOpen} 
          isMobile={isMobile} 
          nigeriaBounds={nigeriaBounds} 
        />
        <GeoJsonLayer
          geoJson={geoJson as any}
          stateGeoJson={stateGeoJson}
          lgas={lgas}
          lgaMap={lgaMap}
          programmes={programmes}
          filteredIds={filteredIds}
          mapMode={mapMode as MapMode}
          capacityType={capacityType}
          verifiedOnly={verifiedOnly}
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
            {hoveredData.state ? `${hoveredData.state} / ` : ''}LGA
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
