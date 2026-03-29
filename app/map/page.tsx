'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  AlertTriangle, Search, Shield,
  ChevronRight, X, Users, Activity, BarChart3, Layers,
  ChevronLeft, Menu as MenuIcon, Check, Filter
} from 'lucide-react';
import { BrandLoader } from '@/components/BrandLoader';
import { motion, AnimatePresence } from 'motion/react';
import { PartnerLogo } from '@/components/PartnerLogo';
import type { GeoJsonObject } from 'geojson';
import { 
  getPriorityColor, 
  getCapacityColor, 
  TRUST_COLOURS, 
  PRIORITY_THRESHOLDS, 
  CAPACITY_THRESHOLDS,
  MapMode 
} from '@/lib/map-utils';
import type { LGA } from '@/components/LeafletMap';

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

// ─── Legend configs (mirrors colour scales in map-utils.ts) ─────────────────

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

const SECTORS = ['Health', 'Education', 'WASH', 'Nutrition', 'Protection'];

// ─── MapPage ──────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [loading, setLoading]         = useState(true);
  const [geoLoading, setGeoLoading]   = useState(true);
  const [lgas, setLgas]               = useState<any[]>([]);
  const [programmes, setProgrammes]   = useState<{
    lga_id: number;
    programme_id: number;
    programmes: any;
  }[]>([]);
  const [geoJson, setGeoJson]         = useState<GeoJsonObject | null>(null);
  const [stateGeoJson, setStateGeoJson] = useState<GeoJsonObject | null>(null);
  const [view, setView]               = useState<'national' | 'lga'>('national');
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [hoveredLga, setHoveredLga]   = useState<any>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [mapMode, setMapMode]         = useState<MapMode>('priority');
  const [capacityType, setCapacityType] = useState<'ngos' | 'programmes'>('ngos');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(SECTORS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
        supabase.from('programme_lgas').select('lga_id, programme_id, programmes(id, organisation_id, status, sector_id)'),
        supabase.from('iati_funding').select('lga_id, amount_usd'),
      ]);

      // Aggregate funding by LGA
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

  // ── Fetch GeoJSON once ────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch LGA GeoJSON
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

    // Fetch State GeoJSON for national view
    fetch('https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1.geojson')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((data: GeoJsonObject) => {
        setStateGeoJson(data);
      })
      .catch(err => {
        console.error('State GeoJSON load failed:', err);
      });
  }, []);

  const currentGeoJson = useMemo(() => {
    if (view === 'national') return stateGeoJson;
    return geoJson;
  }, [view, stateGeoJson, geoJson]);

  // ── Stats for hovered/selected LGA ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!activeLga) return null;

    // If it's a state aggregation (clicked in national view)
    if (view === 'national' && activeLga.state && !activeLga.id) {
      const stateLgas = lgas.filter(l => l.state === activeLga.state);
      const totalFunding = stateLgas.reduce((sum, l) => sum + (l.total_funding_usd || 0), 0);
      const avgGap = stateLgas.reduce((sum, l) => sum + (l.gap_score || 0), 0) / stateLgas.length;
      const totalNgos = stateLgas.reduce((sum, l) => sum + (l.ngo_count_verified || 0), 0);
      
      const stateProgCount = stateLgas.reduce((sum, l) => sum + programmes.filter(p => p.lga_id === l.id).length, 0);
      
      return {
        isState: true,
        name: activeLga.state,
        funding: totalFunding,
        gap: avgGap,
        ngoCount: totalNgos,
        lgaCount: stateLgas.length,
        progCount: stateProgCount
      };
    }

    const lgaLinks = programmes.filter(p => p.lga_id === activeLga.id);
    const uniqueOrgs = new Set(
      lgaLinks
        .map(p => p.programmes?.organisation_id)
        .filter(Boolean)
    ).size;
    
    const SECTOR_NAMES: Record<number, string> = {
      1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
    };
    
    const gaps = ['Health','Education','WASH','Nutrition','Protection']
      .filter(s => {
        const sectorId = Object.entries(SECTOR_NAMES).find(([_, name]) => name === s)?.[0];
        return !lgaLinks.some(p => p.programmes?.sector_id === Number(sectorId));
      });

    return { 
      isState: false,
      name: activeLga.name,
      state: activeLga.state,
      orgCount: uniqueOrgs, 
      progCount: lgaLinks.length, 
      gaps, 
      gapCount: gaps.length,
      funding: activeLga.total_funding_usd || 0,
      gap: activeLga.gap_score || 0,
      trust: activeLga.dominant_trust_tier,
      ngoCount: activeLga.ngo_count_verified || 0
    };
  }, [activeLga, programmes, lgas, view]);

  const states = useMemo(
    () => Array.from(new Set(lgas.map(l => l.state))).sort(),
    [lgas],
  );

  const filteredLgas = useMemo(() => {
    const SECTOR_NAMES: Record<number, string> = {
      1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
    };

    return lgas.filter(lga => {
      const matchSearch =
        lga.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lga.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchState  = !selectedState || lga.state === selectedState;
      
      // If all sectors are selected, don't filter by sector
      if (selectedSectors.length === SECTORS.length) return matchSearch && matchState;

      // Check primary needs
      const primaryNeeds = lga.primary_needs || [];
      const hasNeedMatch = selectedSectors.some(s => primaryNeeds.includes(s));

      // Check active programmes
      const lgaProgrammes = programmes.filter(p => p.lga_id === lga.id);
      const activeSectors = lgaProgrammes.map(p => SECTOR_NAMES[p.programmes?.sector_id]).filter(Boolean);
      const hasActiveMatch = selectedSectors.some(s => activeSectors.includes(s));

      return matchSearch && matchState && (hasNeedMatch || hasActiveMatch);
    });
  }, [lgas, searchTerm, selectedState, selectedSectors, programmes]);

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
    <main className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Navbar />

      <div className="flex-grow relative overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[1040]"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -320 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-[320px] max-w-[66%] sm:w-80 h-full bg-white/90 backdrop-blur-md border-r border-slate-200 flex flex-col z-[1050] shadow-xl overflow-visible"
        >
          {/* Sidebar Toggle Button */}
          <div className="absolute top-6 left-full z-[1060]">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2.5 bg-white/90 backdrop-blur-md rounded-r-xl shadow-lg border-y border-r border-slate-200 hover:bg-slate-50 transition-all text-slate-600 ${
                isMobile && isSidebarOpen ? 'ring-1 ring-slate-200/50' : ''
              }`}
              title={isSidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 space-y-5">
                {/* Mode switcher */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Visualisation Lens
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                    {(Object.keys(MODE_META) as MapMode[]).map(mode => {
                      const { label, Icon } = MODE_META[mode];
                      const active = mapMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setMapMode(mode)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold transition-all ${
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

                {/* Capacity Sub-filters */}
                <AnimatePresence>
                  {mapMode === 'capacity' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Measure By</label>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                          <button
                            onClick={() => setCapacityType('ngos')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              capacityType === 'ngos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            NGOs
                          </button>
                          <button
                            onClick={() => setCapacityType('programmes')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              capacityType === 'programmes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Programmes
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          verifiedOnly 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">Verified Partners Only</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${verifiedOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${verifiedOnly ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Input - Moved back to Sidepanel */}
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search LGA or State..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* State & LGA */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                    <select
                      value={selectedState}
                      onChange={e => {
                        setSelectedState(e.target.value);
                        setSelectedLga(null);
                      }}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                    >
                      <option value="">All States</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LGA</label>
                    <select
                      value={selectedLga?.id || ''}
                      onChange={e => {
                        const lga = lgas.find(l => l.id === Number(e.target.value));
                        setSelectedLga(lga || null);
                      }}
                      disabled={!selectedState}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 disabled:opacity-50 disabled:bg-slate-50"
                    >
                      <option value="">All LGAs</option>
                      {lgas
                        .filter(l => l.state === selectedState)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                      }
                    </select>
                  </div>
                </div>

                {/* Sectors */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sectors</label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map(sector => {
                      const isSelected = selectedSectors.includes(sector);
                      return (
                        <label
                          key={sector}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input type="checkbox" className="hidden"
                            checked={isSelected}
                            onChange={() => handleSectorToggle(sector)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3 h-3" />
                          </div>
                          {sector}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-white/40 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Showing</div>
                    <div className="text-lg font-bold text-slate-900">{filteredLgas.length}</div>
                    <div className="text-[10px] text-slate-400">of {lgas.length} LGAs</div>
                  </div>
                  <div className="p-3 bg-red-50/40 rounded-xl border border-red-100">
                    <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Critical</div>
                    <div className="text-lg font-bold text-red-700">{criticalCount}</div>
                    <div className="text-[10px] text-red-400">gap &gt; 0.8</div>
                  </div>
                </div>

                {/* Mobile Legend */}
                <div className="md:hidden pt-2 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <ModeIcon className="w-3.5 h-3.5 text-slate-400" />
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {legend.title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {legend.items.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-[10px] font-medium text-slate-600">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gap alert */}
                {criticalCount > 0 && (
                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Intelligence Alert
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {criticalCount} LGAs show critical gaps despite high need scores.
                    </p>
                    <button
                      className="mt-3 text-xs font-bold text-amber-900 underline"
                      onClick={() => setMapMode('priority')}
                    >
                      View on map →
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>

        {/* ── Map pane ────────────────────────────────────────────────────────── */}
        <div className="w-full h-full relative bg-slate-100 overflow-hidden">
          {/* Sidebar Toggle Button Group - Removed from here as it's now inside the sidebar */}

          <LeafletMap
            lgas={filteredLgas}
            programmes={programmes}
            onSelectLga={(lga) => {
              if (view === 'national') {
                if (lga && lga.state) {
                  setSelectedState(lga.state);
                  setView('lga');
                }
              } else {
                setSelectedLga(lga);
              }
            }}
            onHoverLga={setHoveredLga}
            onViewChange={setView}
            mapMode={mapMode}
            capacityType={capacityType}
            verifiedOnly={verifiedOnly}
            view={view}
            geoJson={geoJson}
            stateGeoJson={stateGeoJson}
            isMobile={isMobile}
            selectedState={selectedState}
          />

          {/* ── Legend (Desktop only, moved above zoom controls) ────────────────── */}
          <div className="hidden md:block absolute bottom-6 right-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 z-[999] min-w-[170px]">
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

          {/* ── LGA info card / Bottom Sheet ────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedLga && stats && (
              <motion.div
                key="lga-info-card"
                drag={isMobile ? "y" : false}
                dragConstraints={isMobile ? { top: -400, bottom: 300 } : false}
                dragElastic={0.1}
                initial={isMobile ? { y: '100%', opacity: 0 } : { x: 20, opacity: 0 }}
                animate={isMobile ? { 
                  y: 0, 
                  opacity: 1,
                  left: 0,
                  bottom: 0,
                  top: 'auto',
                  width: '100%'
                } : { 
                  x: 0, 
                  opacity: 1,
                  left: isSidebarOpen ? (isMobile ? 'min(50%, 280px)' : '320px') : '24px',
                  bottom: 24,
                  top: 'auto',
                  width: '22rem'
                }}
                exit={isMobile ? { y: '100%', opacity: 0 } : { x: -20, opacity: 0 }}
                transition={{ 
                  left: { duration: 0.3, ease: 'easeInOut' },
                  x: { type: 'spring', damping: 25, stiffness: 200 },
                  default: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
                }}
                className={`absolute z-[1055] ${isMobile ? 'px-4 pb-4' : ''}`}
              >
                <div className={`bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/60 overflow-hidden ${
                  isMobile ? 'rounded-t-3xl rounded-b-xl' : 'rounded-3xl'
                }`}>
                  {/* Mobile Drag Handle */}
                  {isMobile && (
                    <div className="w-full flex justify-center pt-3 pb-1">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                    </div>
                  )}

                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                            {stats.isState ? 'State Overview' : 'LGA Profile'}
                          </span>
                          {!stats.isState && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {stats.state}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                          {stats.name}
                        </h2>
                      </div>
                      <button 
                        onClick={() => setSelectedLga(null)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Hero Metric based on Map Mode */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {mapMode === 'priority' ? 'Need Intensity' : 
                           capacityType === 'ngos' ? 'NGO Presence' : 'Activity Volume'}
                        </div>
                        <div className="text-3xl font-black text-slate-900 leading-none">
                          {mapMode === 'priority' ? `${(stats.gap * 100).toFixed(0)}%` : 
                           capacityType === 'ngos' ? stats.ngoCount : stats.progCount}
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ 
                        backgroundColor: mapMode === 'priority' 
                          ? getPriorityColor(stats.gap, stats.funding / (stats.lgaCount || 1)) 
                          : getCapacityColor(capacityType === 'ngos' ? stats.ngoCount : stats.progCount)
                      }}>
                        {mapMode === 'priority' ? <Shield className="w-6 h-6 text-white" /> : <Activity className="w-6 h-6 text-white" />}
                      </div>
                    </div>

                    {/* Common Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">NGOs</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">{stats.ngoCount}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Verified Partners</div>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <Activity className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">{stats.progCount || stats.lgaCount}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {stats.isState ? 'LGAs in State' : 'Active Programmes'}
                        </div>
                      </div>
                    </div>

                    {/* Gaps / Missing Sectors */}
                    {!stats.isState && stats.gaps && stats.gaps.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Gaps</h3>
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
                            {stats.gapCount} Missing
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stats.gaps.map(gap => (
                            <span key={gap} className="px-3 py-1.5 bg-white border border-red-100 text-red-700 text-[10px] font-bold rounded-xl shadow-sm flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group">
                      View Detailed Intelligence
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
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
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm z-[2000]"
              >
                <BrandLoader size="lg" />
                <p className="mt-4 text-slate-600 font-semibold">
                  {geoLoading ? 'Loading LGA boundaries…' : 'Fetching coordination data…'}
                </p>
                <p className="text-slate-400 text-sm mt-1">Nigeria · 774 LGAs</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}