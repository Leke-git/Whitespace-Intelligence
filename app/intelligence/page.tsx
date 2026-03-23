'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Zap, AlertTriangle, TrendingUp, MapPin, Search, Filter, Info, ArrowRight, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'motion/react';

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
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLga, setSelectedLga] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
    fetchAnalyses();
  }, [fetchAnalyses]);

  const filteredAnalyses = analyses.filter(a => {
    const matchPriority = filter === 'all' || (filter === 'critical' && a.is_critical_gap) || (filter === 'low-risk' && a.duplication_risk === 'Low');
    const matchSearch = a.lga_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchState = !selectedState || a.state === selectedState;
    const matchSector = selectedSectors.length === 0 || selectedSectors.includes(a.sector);
    const matchLga = !selectedLga || a.lga_name === selectedLga;
    return matchPriority && matchSearch && matchState && matchSector && matchLga;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
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
          className="absolute top-0 left-0 w-80 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-[1050] shadow-2xl"
        >
          <div className={`absolute top-6 transition-all duration-300 ${isMobile ? 'right-4' : 'left-[calc(100%+1.5rem)]'}`}>
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
            <div className={`flex items-center justify-between mb-2 ${isMobile ? 'pr-12' : ''}`}>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Intelligence</h2>
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

            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Results</span>
                <span className="text-xs font-bold text-slate-900">{filteredAnalyses.length}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(filteredAnalyses.length / Math.max(analyses.length, 1)) * 100}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-red-50 rounded-lg flex items-center justify-center mb-1">
                    <AlertTriangle className="text-red-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={12} />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">Gaps</div>
                </div>

                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-emerald-50 rounded-lg flex items-center justify-center mb-1">
                    <TrendingUp className="text-emerald-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={85} suffix="%" />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">Accuracy</div>
                </div>

                <div className="bg-white p-1.5 sm:p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                    <MapPin className="text-blue-600 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                  </div>
                  <div className="text-[10px] sm:text-sm font-bold text-slate-900 leading-none mb-0.5">
                    <AnimatedCounter value={774} />
                  </div>
                  <div className="text-[6px] sm:text-[8px] text-slate-400 font-bold uppercase leading-tight">LGAs</div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex-grow relative overflow-hidden bg-slate-50">
          <div className={`h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen && !isMobile ? 'pl-80' : ''}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              {paginatedAnalyses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-6">
                    {paginatedAnalyses.map((analysis, i) => (
                      <motion.div
                        key={analysis.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-white rounded-3xl border p-5 sm:p-8 shadow-sm hover:shadow-md transition-all ${
                          analysis.is_critical_gap ? 'border-red-100' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 break-words leading-tight overflow-hidden text-ellipsis">{analysis.lga_name}</h3>
                              {analysis.is_critical_gap && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap shrink-0">
                                  Critical Gap
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] sm:text-xs">{analysis.sector} Sector</p>
                          </div>
                          <div className="sm:text-right flex items-baseline gap-2 sm:block shrink-0">
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">{(analysis.gap_score * 100).toFixed(0)}%</div>
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Gap Score</div>
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

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-slate-100">
                          <div className="flex items-center gap-6">
                            <div>
                              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duplication Risk</div>
                              <div className={`text-sm font-bold ${
                                analysis.duplication_risk === 'Low' ? 'text-emerald-600' :
                                analysis.duplication_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {analysis.duplication_risk}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <Link
                              href="/map"
                              className="text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2 sm:ml-0"
                              title="View on Map"
                            >
                              <MapPin className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/lga/${analysis.id}`}
                              className="flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors bg-slate-50 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl whitespace-nowrap"
                            >
                              View Profile
                              <ArrowRight className="w-4 h-4" />
                            </Link>
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
