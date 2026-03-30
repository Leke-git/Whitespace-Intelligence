'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import NextDynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  AlertTriangle, Search, Shield,
  ChevronRight, X, Users, Activity,
  ChevronLeft, ChevronDown, ChevronUp, Check, Filter, Globe
} from 'lucide-react';
import { BrandLoader } from '@/components/BrandLoader';
import { motion, AnimatePresence } from 'motion/react';
import type { GeoJsonObject } from 'geojson';
import { 
  getPriorityColor, 
  getCapacityColor, 
  PRIORITY_THRESHOLDS, 
  CAPACITY_THRESHOLDS,
  MapMode 
} from '@/lib/map-utils';
import { KolaNut } from '@/components/KolaNut';

// ─── Dynamic import (avoids SSR) ─────────────────────────────────────────────

const LeafletMap = NextDynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
      <BrandLoader size="md" />
      <p className="mt-4 text-slate-500 font-medium">Loading Coordination Map...</p>
    </div>
  ),
});

// ─── Constants ──────────────────────────────────────────────────────────────

const SECTORS_LIST = [
  'Protection',
  'Food Security',
  'Health',
  'Nutrition',
  'WASH',
  'Education',
  'Shelter',
  'CCCM'
];

const LEGENDS: Record<MapMode, { title: string; items: { label: string; color: string }[] }> = {
  priority: {
    title: 'Investment Priority',
    items: PRIORITY_THRESHOLDS.map(t => ({ label: t.label, color: t.color })),
  },
  capacity: {
    title: 'Partner Capacity',
    items: CAPACITY_THRESHOLDS.map(t => ({ label: t.label, color: t.color })),
  },
};

const MODE_META: Record<MapMode, { label: string; Icon: React.ElementType }> = {
  priority: { label: 'Priority', Icon: Shield },
  capacity: { label: 'Capacity', Icon: Users },
};

// ─── MapPage ──────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [loading, setLoading]         = useState(true);
  const [geoLoading, setGeoLoading]   = useState(true);
  const [lgas, setLgas]               = useState<any[]>([]);
  const [programmes, setProgrammes]   = useState<any[]>([]);
  const [geoJson, setGeoJson]         = useState<GeoJsonObject | null>(null);
  const [stateGeoJson, setStateGeoJson] = useState<GeoJsonObject | null>(null);
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [hoveredLga, setHoveredLga]   = useState<any>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [mapMode, setMapMode]         = useState<MapMode>('priority');
  const [capacityType, setCapacityType] = useState<'ngos' | 'programmes'>('ngos');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNationalStats, setShowNationalStats] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  // ── Mobile detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeLga = isMobile ? selectedLga : (selectedLga || hoveredLga);

  // ── Fetch DB data ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [
        { data: lgaData }, 
        { data: progData },
        { data: fundingData }
      ] = await Promise.all([
        supabase.from('lga_gap_scores').select('*'),
        supabase.from('programme_lgas').select('lga_id, programme_id, sector'),
        supabase.from('iati_funding').select('lga_id, amount_usd'),
      ]);

      const fundingMap = (fundingData ?? []).reduce((acc: any, curr: any) => {
        if (!curr.lga_id) return acc;
        acc[curr.lga_id] = (acc[curr.lga_id] || 0) + Number(curr.amount_usd);
        return acc;
      }, {});

      const enrichedLgas = (lgaData ?? []).map(lga => ({
        ...lga,
        total_funding_usd: fundingMap[lga.id] || 0
      }));

      setLgas(enrichedLgas);
      setProgrammes(progData ?? []);
      setLoading(false);
    })();
  }, []);

  // ── Fetch GeoJSON ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://hjxcwscjtxjmjqklsecc.supabase.co/storage/v1/object/public/geodata/nigeria_lga.geojson')
      .then(r => r.json())
      .then((data: GeoJsonObject) => {
        setGeoJson(data);
        setGeoLoading(false);
      })
      .catch(err => {
        console.error('LGA GeoJSON load failed:', err);
        setGeoLoading(false);
      });

    const fetchStates = async () => {
      const url = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/nigeria.geojson';
      try {
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          setStateGeoJson(data);
        }
      } catch (err) {
        console.error('State GeoJSON load failed:', err);
      }
    };
    fetchStates();
  }, []);

  // ── Stats for hovered/selected LGA ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!activeLga) return null;

    const lgaLinks = programmes.filter(p => p.lga_id === activeLga.id);
    const activeSectors = Array.from(new Set(lgaLinks.map(p => p.sector))).filter(Boolean);
    
    const gaps = SECTORS_LIST.filter(s => !activeSectors.includes(s));

    return { 
      name: activeLga.name,
      state: activeLga.state,
      ngoCount: activeLga.ngo_count_verified || 0,
      progCount: lgaLinks.length, 
      activeSectors,
      gaps, 
      gapCount: gaps.length,
      funding: activeLga.total_funding_usd || 0,
      gap: activeLga.gap_score || 0,
      need: activeLga.need_score || 0
    };
  }, [activeLga, programmes]);

  const states = useMemo(
    () => Array.from(new Set(lgas.map(l => l.state))).sort(),
    [lgas],
  );

  const filteredLgas = useMemo(() => {
    let result = lgas;

    if (selectedState) {
      result = result.filter(l => l.state === selectedState);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(s) || 
        l.state.toLowerCase().includes(s)
      );
    }

    if (selectedSectors.length > 0) {
      result = result.filter(l => {
        const lgaProgs = programmes.filter(p => p.lga_id === l.id);
        const activeSectors = new Set(lgaProgs.map(p => p.sector));
        return selectedSectors.every(s => activeSectors.has(s));
      });
    }

    return result;
  }, [lgas, selectedState, searchTerm, selectedSectors, programmes]);

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
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      <Navbar />

      <div className="flex-grow relative overflow-hidden">
        {/* ── Map Pane ────────────────────────────────────────────────────────── */}
        <div className="w-full h-full relative">
          <LeafletMap
            lgas={filteredLgas}
            programmes={programmes}
            onSelectLga={setSelectedLga}
            onHoverLga={setHoveredLga}
            mapMode={mapMode}
            capacityType={capacityType}
            verifiedOnly={verifiedOnly}
            geoJson={geoJson}
            stateGeoJson={stateGeoJson}
            isMobile={isMobile}
            selectedState={selectedState}
            drawerOpen={!!selectedLga}
          />

          {/* ── Floating Command Bar (Top) ────────────────────────────────────── */}
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-full px-4 z-[1000] flex gap-2 transition-all duration-500 ${selectedLga ? 'max-w-lg lg:-translate-x-[calc(50%+100px)]' : 'max-w-2xl'}`}>
            <div className="flex-grow relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search LGA or State..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-sm font-medium"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(true)}
              className={`px-4 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 hover:bg-slate-50 transition-all flex items-center gap-2 ${selectedSectors.length > 0 ? 'text-emerald-600' : 'text-slate-600'}`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filters</span>
              {selectedSectors.length > 0 && (
                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  {selectedSectors.length}
                </span>
              )}
            </button>

            <select
              value={selectedState}
              onChange={e => {
                setSelectedState(e.target.value);
                setSelectedLga(null);
              }}
              className="hidden md:block px-4 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* ── Lens Switcher (Bottom Center) ─────────────────────────────────── */}
          <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-4 transition-all duration-500 ${selectedLga ? 'lg:-translate-x-[calc(50%+100px)]' : ''}`}>
            <div className="flex p-1.5 bg-slate-900/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/10">
              {(Object.keys(MODE_META) as MapMode[]).map(mode => {
                const { label, Icon } = MODE_META[mode];
                const active = mapMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setMapMode(mode)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      active
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
            
            {/* Capacity Sub-toggle */}
            <AnimatePresence>
              {mapMode === 'capacity' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-1 p-1 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200"
                >
                  <button
                    onClick={() => setCapacityType('ngos')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      capacityType === 'ngos' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    NGOs
                  </button>
                  <button
                    onClick={() => setCapacityType('programmes')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      capacityType === 'programmes' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Programmes
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── National Intelligence Bento (Top Left) ─────────────────────── */}
          <div className="absolute top-28 left-6 z-[1000] hidden xl:block">
            <motion.div 
              layout
              className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-slate-200/60 w-72 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">National Intel</h3>
                </div>
                <button 
                  onClick={() => setShowNationalStats(!showNationalStats)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  {showNationalStats ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Critical LGAs</div>
                  <div className="text-xl font-black text-red-600">{criticalCount}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orgs</div>
                  <div className="text-xl font-black text-slate-900">142</div>
                </div>
              </div>

              <AnimatePresence>
                {showNationalStats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-slate-100 space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Overall Response Gap</span>
                        <span className="text-red-500">64%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[64%]" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      &quot;North-East coordination remains strained in WASH and Protection sectors. 12 LGAs in Borno report zero verified partner presence.&quot;
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Map Legend (Bottom Left) ─────────────────────────────────────── */}
          <div className={`absolute bottom-10 left-6 z-[1000] hidden md:block transition-all duration-500 ${selectedLga ? 'opacity-0 pointer-events-none translate-x-10' : 'opacity-100'}`}>
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-slate-200/60 min-w-[180px]">
              <div className="flex items-center gap-2 mb-3">
                <ModeIcon className="w-3.5 h-3.5 text-emerald-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  {legend.title}
                </h3>
              </div>
              <div className="space-y-2">
                {legend.items.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: item.color }} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Contextual Intelligence Panel (LGA Detail) ────────────────────── */}
          <AnimatePresence>
            {selectedLga && stats && (
              <>
                {/* Backdrop for Mobile/Tablet only */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedLga(null)}
                  className="absolute inset-0 z-[1050] bg-slate-900/20 backdrop-blur-sm lg:hidden"
                />
                
                <motion.div
                  initial={isMobile ? { y: '100%' } : { x: '100%' }}
                  animate={isMobile ? { y: 0 } : { x: 0 }}
                  exit={isMobile ? { y: '100%' } : { x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`absolute z-[1100] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-slate-200 flex flex-col transition-all duration-500 ${
                    isMobile 
                      ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-[3rem] border-t' 
                      : 'top-0 right-0 w-[480px] h-full border-l'
                  }`}
                >
                  {/* Panel Header */}
                  <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                          LGA Intelligence
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {stats.state} State
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {stats.name}
                      </h2>
                    </div>
                    <button 
                      onClick={() => setSelectedLga(null)}
                      className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Scrollable Intelligence Feed */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                    
                    <div className="grid grid-cols-6 gap-4">
                      {/* Bento Block 1: The Visual Core (Large) */}
                      <div className="col-span-6 md:col-span-4 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity className="w-24 h-24" />
                        </div>
                        <KolaNut 
                          size={180} 
                          sectors={SECTORS_LIST} 
                          activeSectors={stats.activeSectors || []} 
                          orgCount={stats.ngoCount} 
                        />
                        <div className="mt-4 text-center">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Sector Health Index</p>
                        </div>
                      </div>

                      {/* Bento Block 2: Quick Stats (Stacked) */}
                      <div className="col-span-6 md:col-span-2 space-y-4">
                        <div className="p-5 bg-emerald-500 rounded-[2rem] text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-center">
                          <Users className="w-5 h-5 mb-2 opacity-80" />
                          <div className="text-2xl font-black">{stats.ngoCount}</div>
                          <div className="text-[8px] font-bold uppercase tracking-widest opacity-70 text-white">Partners</div>
                        </div>
                        <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                          <Globe className="w-5 h-5 mb-2 text-slate-300" />
                          <div className="text-xl font-black text-slate-900">${(stats.funding / 1000000).toFixed(1)}M</div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Funding</div>
                        </div>
                      </div>

                      {/* Bento Block 3: Humanized Summary (Wide) */}
                      <div className="col-span-6 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                        <div className="absolute -bottom-4 -right-4 p-4 opacity-10">
                          <Shield className="w-16 h-16" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Intelligence Summary</span>
                        </div>
                        <p className="text-sm leading-relaxed font-medium pr-8">
                          {stats.gap > 0.7 
                            ? `${stats.name} is a high-priority zone. Critical gaps persist in ${stats.gaps.slice(0, 2).join(' and ')}.`
                            : `${stats.name} shows stable coordination. Sector coverage is balanced across the region.`
                          }
                        </p>
                      </div>

                      {/* Bento Block 4: Sector Health Grid (Detailed) */}
                      <div className="col-span-6 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Sector Breakdown</h3>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {SECTORS_LIST.map(sector => {
                            const isActive = stats.activeSectors?.includes(sector);
                            return (
                              <div key={sector} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isActive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/30 border-slate-100 opacity-60'}`}>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{sector}</span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="p-8 pt-4 border-t border-slate-100 shrink-0">
                    <button className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group">
                      Download Intelligence Report
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Filter Overlay ────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[1200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-8 pb-4 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Refine Intelligence</h3>
                    <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sectors of Interest</label>
                      <div className="grid grid-cols-2 gap-3">
                        {SECTORS_LIST.map(sector => {
                          const isSelected = selectedSectors.includes(sector);
                          return (
                            <button
                              key={sector}
                              onClick={() => handleSectorToggle(sector)}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                  : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xs font-bold">{sector}</span>
                              {isSelected && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold">Verified Partners Only</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Filter by data quality</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${verifiedOnly ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${verifiedOnly ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-8 pt-0">
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading Overlay ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {(loading || geoLoading) && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xl z-[2000]"
              >
                <BrandLoader size="lg" />
                <div className="mt-8 text-center">
                  <p className="text-lg font-black text-slate-900 uppercase tracking-widest">
                    {geoLoading ? 'Mapping Boundaries' : 'Syncing Intelligence'}
                  </p>
                  <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-[0.2em]">Nigeria · 774 LGAs · Live Data</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
