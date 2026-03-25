'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Zap, AlertTriangle, TrendingUp, MapPin, Search, Filter, Info, ArrowRight, ChevronLeft, ChevronRight, X, Check, BarChart3, PieChart, Activity, Target } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'motion/react';

const ITEMS_PER_PAGE = 4;

function AnimatedCounter({ value, duration = 2, suffix = "" }: { value: number, duration?: number, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{displayValue}{suffix}</span>;
}

interface GapAnalysis {
  id: number;
  lga_name: string;
  sector: string;
  state?: string;
  gap_score: number;
  is_critical_gap: boolean;
  duplication_risk: string;
  summary: string;
  recommendation: string;
  created_at: string;
}

const SECTOR_NAMES: Record<number, string> = {
  1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
};

export default function IntelligencePage() {
  const [analyses, setAnalyses] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLga, setSelectedLga] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [lgas, setLgas] = useState<any[]>([]);
  const [activeSectorTab, setActiveSectorTab] = useState('All');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('lga_gap_scores')
      .select('id, name, state, gap_score, updated_at, primary_needs')
      .order('gap_score', { ascending: false });

    if (error) {
      console.error('Error fetching analyses:', error);
      // ... existing dummy data logic ...
    } else {
      // Fetch funding data as well
      const { data: fundingData } = await supabase.from('iati_funding').select('lga_id, amount_usd');
      const fundingMap = (fundingData ?? []).reduce((acc: any, curr: any) => {
        if (!curr.lga_id) return acc;
        acc[curr.lga_id] = (acc[curr.lga_id] || 0) + Number(curr.amount_usd);
        return acc;
      }, {});

      const enrichedLgas = (data || []).map(l => ({
        ...l,
        total_funding_usd: fundingMap[l.id] || 0
      }));
      setLgas(enrichedLgas);

      const mappedData: GapAnalysis[] = (enrichedLgas || []).map((item: any) => ({
        id: item.id,
        lga_name: item.name || 'Unknown LGA',
        state: item.state,
        sector: (item.primary_needs && item.primary_needs.length > 0) ? item.primary_needs[0] : 'General',
        gap_score: parseFloat(item.gap_score),
        is_critical_gap: parseFloat(item.gap_score) > 0.8,
        duplication_risk: parseFloat(item.gap_score) < 0.3 ? 'High' : parseFloat(item.gap_score) < 0.6 ? 'Medium' : 'Low',
        summary: `Gap score of ${(parseFloat(item.gap_score) * 100).toFixed(0)}% identified in ${item.name || 'this LGA'}. Primary needs include ${item.primary_needs?.join(', ') || 'various sectors'}.`,
        recommendation: parseFloat(item.gap_score) > 0.8
          ? 'Immediate intervention required to address critical service gaps. Coordinate with state emergency management.'
          : 'Monitor situation and coordinate with existing partners to optimize resource allocation.',
        created_at: item.updated_at
      }));
      setAnalyses(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalyses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAnalyses]);

  const filteredAnalyses = analyses.filter(a => {
    const matchPriority = filter === 'all' || (filter === 'critical' && a.is_critical_gap) || (filter === 'low-risk' && a.duplication_risk === 'Low');
    const matchSearch = a.lga_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchState = !selectedState || a.state === selectedState;
    const matchSector = activeSectorTab === 'All' ? (selectedSectors.length === 0 || selectedSectors.includes(a.sector)) : a.sector === activeSectorTab;
    const matchLga = !selectedLga || a.lga_name === selectedLga;
    return matchPriority && matchSearch && matchState && matchSector && matchLga;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    criticalGaps: filteredAnalyses.filter(a => a.is_critical_gap).length,
    avgGapScore: filteredAnalyses.length > 0 
      ? Math.round((filteredAnalyses.reduce((acc, curr) => acc + curr.gap_score, 0) / filteredAnalyses.length) * 100) 
      : 0,
    totalLGAs: filteredAnalyses.length
  };

  // Bento Metrics
  const redZone = [...analyses].sort((a, b) => b.gap_score - a.gap_score).slice(0, 3);
  const highRiskCount = analyses.filter(a => a.duplication_risk === 'High').length;
  
  const sectorGaps = Object.values(SECTOR_NAMES).map(name => {
    const sectorAnalyses = analyses.filter(a => a.sector === name);
    const avgGap = sectorAnalyses.length > 0 
      ? sectorAnalyses.reduce((acc, curr) => acc + curr.gap_score, 0) / sectorAnalyses.length 
      : 0;
    return { name, avgGap };
  }).sort((a, b) => b.avgGap - a.avgGap);

  const fundingVacuum = sectorGaps[0];

  return (
    <main className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-grow relative overflow-hidden">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[1040]"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -320 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-[320px] max-w-[66%] sm:w-80 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-[1050] shadow-2xl"
        >
          {/* Sidebar Toggle Button - Now inside the sidebar to move with it */}
          <div className="absolute top-6 left-full ml-4 z-[1060]">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2.5 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 ${
                isMobile && isSidebarOpen ? 'ring-1 ring-slate-200/50' : ''
              }`}
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Open Sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(''); setCurrentPage(1); }}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                >
                  <option value="">All States</option>
                  {Array.from(new Set(analyses.map(a => a.state).filter(Boolean))).sort().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LGA</label>
                <select
                  value={selectedLga}
                  onChange={(e) => { setSelectedLga(e.target.value); setCurrentPage(1); }}
                  disabled={!selectedState}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 disabled:opacity-50 disabled:bg-slate-50"
                >
                  <option value="">All LGAs</option>
                  {Array.from(new Set(analyses.filter(a => a.state === selectedState).map(a => a.lga_name))).sort().map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search LGA or State..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sectors</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedSectors([]); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                    selectedSectors.length === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                    selectedSectors.length === 0
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-300 text-transparent'
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                  All Sectors
                </button>
                {Object.values(SECTOR_NAMES).map(sector => (
                  <button
                    key={sector}
                    onClick={() => {
                      setSelectedSectors(prev =>
                        prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
                      );
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      selectedSectors.includes(sector)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedSectors.includes(sector)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-300 text-transparent'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'critical', 'low-risk'].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      filter === f
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                      filter === f
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-300 text-transparent'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {f === 'all' ? 'All Priorities' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-red-50 rounded-lg flex items-center justify-center mb-1">
                    <AlertTriangle className="text-red-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={stats.criticalGaps} />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">Gaps</div>
                </div>

                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-emerald-50 rounded-lg flex items-center justify-center mb-1">
                    <TrendingUp className="text-emerald-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={stats.avgGapScore} suffix="%" />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">Avg Gap</div>
                </div>

                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                    <MapPin className="text-blue-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={stats.totalLGAs} />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">LGAs</div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex-grow relative overflow-hidden bg-slate-50">
          <div className={`h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen && !isMobile ? 'pl-80' : isSidebarOpen && isMobile ? 'pl-[max(50%,280px)]' : ''}`} style={{ paddingLeft: isSidebarOpen && !isMobile ? '320px' : isSidebarOpen && isMobile ? 'min(50%, 280px)' : '0' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
              
              {/* Bento Dashboard Section */}
              <section className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Strategic Briefing</h2>
                    <p className="text-slate-500 text-sm">Real-time intelligence on Nigeria&apos;s humanitarian landscape.</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Updated: {new Date().toLocaleDateString()}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Red Zone Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <AlertTriangle size={160} />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="text-red-600 w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">The Red Zone: Critical Gaps</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                        {redZone.map((lga, idx) => (
                          <div key={lga.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 transition-colors">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">{lga.lga_name}</div>
                            <div className="text-2xl font-bold text-slate-900 mb-2">{(lga.gap_score * 100).toFixed(0)}%</div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500" style={{ width: `${lga.gap_score * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 italic">These LGAs require immediate partner mobilization.</span>
                        <button className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:underline">
                          View Full List <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Funding Vacuum Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-emerald-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Target size={200} />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <Zap className="text-emerald-300 w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-emerald-100 uppercase tracking-wider text-xs">Funding Vacuum</h3>
                      </div>
                      <div className="mb-2 text-emerald-300 font-serif italic text-lg">{fundingVacuum?.name || 'Sector'}</div>
                      <div className="text-4xl font-bold mb-4 tracking-tighter">{(fundingVacuum?.avgGap * 100).toFixed(0)}% <span className="text-lg font-normal opacity-60">Gap</span></div>
                      <p className="text-emerald-100/70 text-sm leading-relaxed mb-6">
                        Highest recorded need with the lowest partner saturation. Strategic priority #1.
                      </p>
                      <div className="mt-auto">
                        <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-colors">
                          Investigate Sector
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Duplication Risk Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                          <Activity className="text-amber-600 w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Duplication Risk</h3>
                      </div>
                      <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tighter">{highRiskCount}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">LGAs at High Risk</div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        Areas where NGO overlap is high, potentially leading to resource waste.
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="flex -space-x-2 overflow-hidden mb-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200" />
                        ))}
                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-bold text-slate-400">+{highRiskCount - 5}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Sector Intelligence Tabs */}
              <section className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">Sector Intelligence</h2>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
                    {['All', ...Object.values(SECTOR_NAMES)].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { setActiveSectorTab(tab); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          activeSectorTab === tab
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {paginatedAnalyses.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-6">
                      {paginatedAnalyses.map((analysis, i) => (
                        <motion.div
                          key={analysis.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`bg-white rounded-[2.5rem] border p-6 sm:p-10 shadow-sm hover:shadow-xl transition-all group ${
                            analysis.is_critical_gap ? 'border-red-100' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row gap-10">
                            {/* Left: Identity & Score */}
                            <div className="lg:w-1/3 space-y-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded">
                                    {analysis.state}
                                  </span>
                                  {analysis.is_critical_gap && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                                  {analysis.lga_name}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs uppercase tracking-tighter">
                                  <Target size={14} />
                                  {analysis.sector} Focus
                                </div>
                              </div>

                              <div className="pt-6 border-t border-slate-50">
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-5xl font-bold text-slate-900 tracking-tighter">{(analysis.gap_score * 100).toFixed(0)}%</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gap Score</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${analysis.gap_score * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full ${analysis.is_critical_gap ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right: AI Insights & Actions */}
                            <div className="lg:w-2/3 flex flex-col justify-between gap-8">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Info size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Analysis Summary</span>
                                  </div>
                                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                                    {analysis.summary}
                                  </p>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-emerald-600">
                                    <Zap size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Strategic Recommendation</span>
                                  </div>
                                  <p className="text-slate-900 font-medium text-sm leading-relaxed">
                                    {analysis.recommendation}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-slate-50">
                                <div className="flex items-center gap-8">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duplication Risk</span>
                                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                                      analysis.duplication_risk === 'Low' ? 'text-emerald-600' :
                                      analysis.duplication_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${
                                        analysis.duplication_risk === 'Low' ? 'bg-emerald-500' :
                                        analysis.duplication_risk === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                                      }`} />
                                      {analysis.duplication_risk}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Updated</span>
                                    <span className="text-xs font-bold text-slate-600">
                                      {new Date(analysis.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Link
                                    href={`/lga/${analysis.id}`}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                                  >
                                    Full Intelligence Profile
                                    <ArrowRight size={14} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                  {totalPages > 1 && (
                    <div className="mt-16 flex items-center justify-center gap-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const pages: (number | string)[] = [];
                          const maxVisible = 5;
                          if (totalPages <= maxVisible) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (currentPage > 3) pages.push('...');
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            for (let i = start; i <= end; i++) {
                              if (i !== 1 && i !== totalPages) pages.push(i);
                            }
                            if (currentPage < totalPages - 2) pages.push('...');
                            pages.push(totalPages);
                          }
                          return pages.map((page, idx) => (
                            <button
                              key={idx}
                              onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                              disabled={typeof page !== 'number'}
                              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                                currentPage === page
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                  : typeof page === 'number'
                                    ? 'text-slate-600 hover:bg-slate-100'
                                    : 'text-slate-400 cursor-default'
                              }`}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="text-slate-400 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No analyses found</h3>
                  <p className="text-slate-600">Try adjusting your search or filters.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  </main>
  );
}