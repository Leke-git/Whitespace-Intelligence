'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = (leafletInstance: typeof L) => {
  // @ts-ignore
  delete leafletInstance.Icon.Default.prototype._getIconUrl;
  leafletInstance.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface LeafletMapProps {
  lgas: any[];
  onSelectLga: (lga: any) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LeafletMap({ lgas, onSelectLga }: LeafletMapProps) {
  useEffect(() => {
    fixLeafletIcons(L);
  }, []);

  const getNeedColor = (index: number) => {
    if (index >= 0.8) return '#b91c1c'; // bg-red-700
    if (index >= 0.6) return '#ef4444'; // bg-red-500
    if (index >= 0.4) return '#fb923c'; // bg-orange-400
    if (index >= 0.2) return '#facc15'; // bg-yellow-400
    return '#10b981'; // bg-emerald-500
  };

  return (
    <MapContainer
      center={[9.082, 8.6753]} // Center of Nigeria
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {lgas.map((lga) => {
        if (!lga.latitude || !lga.longitude) return null;
        
        return (
          <CircleMarker
            key={lga.id}
            center={[Number(lga.latitude), Number(lga.longitude)]}
            radius={10 + (lga.need_index * 15)}
            pathOptions={{
              fillColor: getNeedColor(lga.need_index),
              fillOpacity: 0.7,
              color: '#fff',
              weight: 2
            }}
            eventHandlers={{
              click: () => onSelectLga(lga)
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-slate-900">{lga.name}</h3>
                <p className="text-xs text-slate-500">{lga.state} State</p>
                <div className="mt-2 text-xs font-bold" style={{ color: getNeedColor(lga.need_index) }}>
                  Need Index: {lga.need_index}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
