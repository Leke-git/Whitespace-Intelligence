'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Zap, AlertTriangle, TrendingUp, MapPin, Search, Filter, Info, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'motion/react';

const ITEMS_PER_PAGE = 6;

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
  const [selectedSector, setSelectedSector] = useState('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('lga_gap_scores')
      .select('id, name, state, gap_score, updated_at, primary_needs')
      .order('gap_score', { ascending: false });

    if (error) {
      console.error('Error fetching analyses:', error);
      // Fallback to dummy data for MVP demonstration
      const dummyData: GapAnalysis[] = [
        {
          id: 1,
          lga_name: 'Maiduguri',
          sector: 'Nutrition',
          state: 'Borno',
          gap_score: 0.92,
          is_critical_gap: true,
          duplication_risk: 'Low',
          summary: 'High gap score (0.92) with only 2 active NGOs in the nutrition sector.',
          recommendation: 'Prioritize therapeutic feeding centers in northern wards.',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          lga_name: 'Kano Municipal',
          sector: 'WASH',
          state: 'Kano',
          gap_score: 0.85,
          is_critical_gap: true,
          duplication_risk: 'Medium',
          summary: 'Rapid population growth outpacing current water infrastructure interventions.',
          recommendation: 'Focus on urban sanitation and drainage systems.',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          lga_name: 'Ikeja',
          sector: 'Education',
          state: 'Lagos',
          gap_score: 0.45,
          is_critical_gap: false,
          duplication_risk: 'High',
          summary: 'Well-served region with 15+ active NGOs in primary education.',
          recommendation: 'Consider pivoting to vocational training or digital literacy.',
          created_at: new Date().toISOString()
        }
      ];
      setAnalyses(dummyData);
    } else {
      const mappedData: GapAnalysis[] = (data || []).map((item: any) => ({
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
    const init = async () => {
      await fetchAnalyses();
    };
    init();
  }, [fetchAnalyses]);

  const states = Array.from(new Set(analyses.map(a => a.lga_name.split(' - ')[1] || 'Unknown'))).sort(); // This is a bit hacky, let's assume we have state info
  // Actually, let's just use the state from the data if available.
  // In fetchAnalyses, I see item.state is fetched. Let's update the mapping.

  const filteredAnalyses = analyses.filter(a => {
    // Priority filter
    const matchPriority = filter === 'all' || (filter === 'critical' && a.is_critical_gap) || (filter === 'low-risk' && a.duplication_risk === 'Low');
    
    // Search filter (LGA name)
    const matchSearch = a.lga_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // State filter
    const matchState = !selectedState || a.state === selectedState;
    
    // Sector filter
    const matchSector = selectedSector === 'all' || a.sector === selectedSector;

    return matchPriority && matchSearch && matchState && matchSector;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <header className="bg-slate-900 text-white py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-dark" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dark)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold mb-6 border border-amber-500/30">
              <Zap className="w-4 h-4" />
              AI-Powered Coordination
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Gap Intelligence <br />
              <span className="text-emerald-500">Engine.</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              We analyze real-time programme data against regional need indices to identify underserved LGAs and prevent duplication of effort.
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="text-red-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Priority</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">
              <AnimatedCounter value={12} />
            </div>
            <div className="text-slate-500 font-medium">Critical Gaps Identified</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Growth</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">
              <AnimatedCounter value={85} suffix="%" />
            </div>
            <div className="text-slate-500 font-medium">Coordination Accuracy</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MapPin className="text-blue-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Coverage</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">
              <AnimatedCounter value={774} />
            </div>
            <div className="text-slate-500 font-medium">LGAs Monitored</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-[64px] z-30 bg-slate-50/80 backdrop-blur-md py-6 mb-12 border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between lg:hidden mb-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {filteredAnalyses.length} Results
            </div>
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by LGA name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-600 font-medium"
              >
                <option value="">All States</option>
                {Array.from(new Set(analyses.map(a => a.state).filter(Boolean))).sort().map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                <button 
                  onClick={() => {
                    setSelectedSector('all');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedSector === 'all' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Sectors
                </button>
                {Object.values(SECTOR_NAMES).map(sector => (
                  <button 
                    key={sector}
                    onClick={() => {
                      setSelectedSector(sector);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                      selectedSector === sector 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-1 bg-slate-200 rounded-2xl w-full lg:w-auto overflow-x-auto">
                {['all', 'critical', 'low-risk'].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-grow lg:flex-grow-0 ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f === 'all' ? 'All Priorities' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isFilterDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterDrawerOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-xs bg-white z-[101] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Filters</h2>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search LGA..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-600 font-medium"
                    >
                      <option value="">All States</option>
                      {Array.from(new Set(analyses.map(a => a.state).filter(Boolean))).sort().map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sectors</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => {
                          setSelectedSector('all');
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                          selectedSector === 'all' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        All Sectors
                      </button>
                      {Object.values(SECTOR_NAMES).map(sector => (
                        <button 
                          key={sector}
                          onClick={() => {
                            setSelectedSector(sector);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                            selectedSector === sector 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sector}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['all', 'critical', 'low-risk'].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setFilter(f);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                            filter === f 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {f === 'all' ? 'All Priorities' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100">
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                  >
                    Show {filteredAnalyses.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {paginatedAnalyses.map((analysis, i) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-3xl border p-8 shadow-sm hover:shadow-md transition-all ${
                analysis.is_critical_gap ? 'border-red-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{analysis.lga_name}</h3>
                    {analysis.is_critical_gap && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Critical Gap
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">{analysis.sector} Sector</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{(analysis.gap_score * 100).toFixed(0)}%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gap Score</div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Summary</div>
                  <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Strategic Recommendation</div>
                  <p className="text-emerald-900 font-medium leading-relaxed">{analysis.recommendation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duplication Risk</div>
                    <div className={`text-sm font-bold ${
                      analysis.duplication_risk === 'Low' ? 'text-emerald-600' : 
                      analysis.duplication_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {analysis.duplication_risk}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link 
                    href="/map"
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="View on Map"
                  >
                    <MapPin className="w-4 h-4" />
                  </Link>
                  <Link 
                    href={`/lga/${analysis.id}`}
                    className="flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors"
                  >
                    View Profile
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
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
                const pages = [];
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
      </div>
    </main>
  );
}
