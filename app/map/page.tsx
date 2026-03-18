'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle, Loader2, Search, Shield,
  ChevronRight, X, Users, Activity, BarChart3, Layers, Info, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MapMode } from '@/components/LeafletMap';
import type { GeoJsonObject } from 'geojson';

// ─── Dynamic import (avoids SSR) ─────────────────────────────────────────────

const LeafletMap = NextDynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading Coordination Map...</p>
      </div>
    </div>
  ),
});

// ─── Legend configs (mirrors colour scales in LeafletMap.tsx) ─────────────────

const LEGENDS: Record<MapMode, { title: string; items: { label: string; color: string }[] }> = {
  gap: {
    title: 'Need Intensity',
    items: [
      { label: 'Critical (≥0.8)',  color: '#7f1d1d' },
      { label: 'High (≥0.6)',      color: '#b91c1c' },
      { label: 'Elevated (≥0.45)', color: '#ef4444' },
      { label: 'Moderate (≥0.3)',  color: '#f97316' },
      { label: 'Low-Mid (≥0.15)', color: '#eab308' },
      { label: 'Low (<0.15)',     color: '#22c55e' },
    ],
  },
  density: {
    title: 'Verified NGOs',
    items: [
      { label: '30+',   color: '#064e3b' },
      { label: '20–29', color: '#065f46' },
      { label: '12–19', color: '#047857' },
      { label: '7–11',  color: '#059669' },
      { label: '3–6',   color: '#10b981' },
      { label: '1–2',   color: '#6ee7b7' },
      { label: 'None',  color: '#f1f5f9' },
    ],
  },
  trust: {
    title: 'Dominant Trust Tier',
    items: [
      { label: 'Accredited', color: '#f59e0b' },
      { label: 'Active',     color: '#10b981' },
      { label: 'Verified',   color: '#8b5cf6' },
      { label: 'Registered', color: '#3b82f6' },
    ],
  },
};

const MODE_META: Record<MapMode, { label: string; Icon: React.ElementType }> = {
  gap:     { label: 'Gap Score',    Icon: BarChart3 },
  density: { label: 'NGO Density',  Icon: Users },
  trust:   { label: 'Trust Tier',   Icon: Activity },
};

const SECTORS = ['Health', 'Education', 'WASH', 'Nutrition', 'Protection'];

// ─── MapPage ──────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [loading, setLoading]         = useState(true);
  const [geoLoading, setGeoLoading]   = useState(true);
  const [lgas, setLgas]               = useState<any[]>([]);
  const [programmes, setProgrammes]   = useState<any[]>([]);
  const [geoJson, setGeoJson]         = useState<GeoJsonObject | null>(null);
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [hoveredLga, setHoveredLga]   = useState<any>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [mapMode, setMapMode]         = useState<MapMode>('gap');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(SECTORS);

  const activeLga = selectedLga || hoveredLga;

  // ── Fetch DB data ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: lgaData }, { data: progData }] = await Promise.all([
        supabase.from('lga_gap_scores').select('*'),
        supabase.from('programmes').select('*, organisations(legal_name)'),
      ]);
      setLgas(lgaData ?? []);
      setProgrammes(progData ?? []);
      setLoading(false);
    })();
  }, []);

  // ── Fetch GeoJSON once ────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://hjxcwscjtxjmjqklsecc.supabase.co/storage/v1/object/public/geodata/nigeria_lga.geojson')
      .then(r => r.json())
      .then((data: GeoJsonObject) => {
        setGeoJson(data);
        setGeoLoading(false);
      })
      .catch(err => {
        console.error('GeoJSON load failed:', err);
        setGeoLoading(false);
      });
  }, []);

  // ── Stats for hovered/selected LGA ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!activeLga) return null;
    const lgaProgs  = programmes.filter(p => p.lga_id === activeLga.id);
    const orgs      = new Set(lgaProgs.map(p => p.organisation_id)).size;
    const covered   = new Set(lgaProgs.map(p => p.sector));
    const gaps      = SECTORS.filter(s => !covered.has(s));
    return { orgCount: orgs, progCount: lgaProgs.length, gaps, gapCount: gaps.length };
  }, [activeLga, programmes]);

  const states = useMemo(
    () => Array.from(new Set(lgas.map(l => l.state))).sort(),
    [lgas],
  );

  const filteredLgas = useMemo(() => {
    return lgas.filter(lga => {
      const matchSearch =
        lga.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lga.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchState  = !selectedState || lga.state === selectedState;
      const matchSector = true;
      return matchSearch && matchState && matchSector;
    });
  }, [lgas, searchTerm, selectedState]);

  const criticalCount = useMemo(
    () => lgas.filter(l => (l.gap_score ?? 0) > 0.8).length,
    [lgas],
  );

  const handleSectorToggle = (sector: string) =>
    setSelectedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector],
    );

  const legend   = LEGENDS[mapMode];
  const modeMeta = MODE_META[mapMode];
  const ModeIcon = modeMeta.Icon;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="h-screen flex bg-slate-50 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">

        {/* Brand */}
        <div className="p-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
              WHITESPACE
            </span>
          </Link>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-5">

          {/* Mode switcher */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Visualisation Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(Object.keys(MODE_META) as MapMode[]).map(mode => {
                const { label, Icon } = MODE_META[mode];
                const active = mapMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setMapMode(mode)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                      active
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : ''}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search LGA or State..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sectors */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sectors</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map(sector => (
                <label
                  key={sector}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-medium cursor-pointer transition-all ${
                    selectedSectors.includes(sector)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input type="checkbox" className="hidden"
                    checked={selectedSectors.includes(sector)}
                    onChange={() => handleSectorToggle(sector)} />
                  {sector}
                </label>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Showing</div>
              <div className="text-lg font-bold text-slate-900">{filteredLgas.length}</div>
              <div className="text-[10px] text-slate-400">of {lgas.length} LGAs</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Critical</div>
              <div className="text-lg font-bold text-red-700">{criticalCount}</div>
              <div className="text-[10px] text-red-400">gap &gt; 0.8</div>
            </div>
          </div>

          {/* Gap alert */}
          {criticalCount > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                Intelligence Alert
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                {criticalCount} LGAs show critical gaps despite high need scores.
              </p>
              <button
                className="mt-3 text-xs font-bold text-amber-900 underline"
                onClick={() => setMapMode('gap')}
              >
                View on map →
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all text-sm">
            <Layers className="w-4 h-4" />
            Layer Settings
          </button>
        </div>
      </aside>

      {/* ── Map pane ────────────────────────────────────────────────────────── */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        <Navbar hideLogo={true} />

        <div className="flex-grow relative bg-slate-200">
          <LeafletMap
            lgas={filteredLgas}
            onSelectLga={setSelectedLga}
            onHoverLga={setHoveredLga}
            mapMode={mapMode}
            geoJson={geoJson}
          />

          {/* ── Legend ──────────────────────────────────────────────────── */}
          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 z-[1000] min-w-[170px]">
            <div className="flex items-center gap-1.5 mb-3">
              <ModeIcon className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {legend.title}
              </h3>
            </div>
            <div className="space-y-1.5">
              {legend.items.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-[10px] font-medium text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Floating controls ────────────────────────────────────────── */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Info className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* ── LGA info card ────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeLga && stats && (
              <motion.div
                key={activeLga.id}
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-6 left-6 w-80 z-[1000]"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="text-xl font-bold text-slate-900 leading-tight pr-2">
                        {activeLga.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          (activeLga.gap_score ?? 0) > 0.7
                            ? 'bg-red-100 text-red-700'
                            : (activeLga.gap_score ?? 0) > 0.4
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {(activeLga.gap_score ?? 0) > 0.7 ? 'Critical'
                            : (activeLga.gap_score ?? 0) > 0.4 ? 'Elevated' : 'Stable'}
                        </span>
                        {selectedLga && (
                          <button
                            onClick={() => setSelectedLga(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{activeLga.state} State</p>
                  </div>

                  {/* Metrics */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active NGOs</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.orgCount}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Programmes</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.progCount}</div>
                      </div>
                    </div>

                    {/* Need bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 font-medium">Need Intensity</span>
                        <span className="text-xs font-bold text-slate-900">
                          {((activeLga.gap_score ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            (activeLga.gap_score ?? 0) > 0.7 ? 'bg-red-500'
                              : (activeLga.gap_score ?? 0) > 0.4 ? 'bg-orange-400'
                              : 'bg-emerald-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(activeLga.gap_score ?? 0) * 100}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Sector gaps */}
                    {stats.gaps.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                          Service Gaps ({stats.gapCount})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {stats.gaps.map(gap => (
                            <span key={gap} className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                              <AlertTriangle className="w-3 h-3" />
                              {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA — only when pinned by click */}
                  {selectedLga && (
                    <Link
                      href={`/lga/${activeLga.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      View full LGA profile
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading overlay ──────────────────────────────────────────── */}
          <AnimatePresence>
            {(loading || geoLoading) && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm z-[2000]"
              >
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 font-semibold">
                    {geoLoading ? 'Loading LGA boundaries…' : 'Fetching coordination data…'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Nigeria · 774 LGAs</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}