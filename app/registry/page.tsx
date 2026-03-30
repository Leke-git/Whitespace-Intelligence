'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ShieldCheck, ExternalLink, MapPin, Users, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandLoader } from '@/components/BrandLoader';

const ITEMS_PER_PAGE = 9;

interface Organisation {
  id: string;
  legal_name: string;
  slug: string;
  cac_number: string;
  trust_tier: string;
  description: string;
  email: string;
  website: string;
  logo_url: string;
  hero_image_url?: string;
  brand_color?: string;
  impact_summary?: string;
  testimonial_quote?: string;
  testimonial_author?: string;
}

const SECTOR_NAMES: Record<number, string> = {
  1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
};

export default function RegistryPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedLga, setSelectedLga] = useState<string>('');
  const [orgSectors, setOrgSectors] = useState<Record<string, string[]>>({});
  const [orgStates, setOrgStates] = useState<Record<string, string[]>>({});
  const [orgLgas, setOrgLgas] = useState<Record<string, string[]>>({});
  const [stateToLgas, setStateToLgas] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const [
      { data: orgData, error: orgError }, 
      { data: progData, error: progError },
      { data: lgaData, error: lgaError }
    ] = await Promise.all([
      supabase.from('organisations').select('*').order('legal_name'),
      supabase.from('programmes').select('organisation_id, sector_id, id'),
      supabase.from('programme_lgas').select('programme_id, lga_id, lga_gap_scores(name, state)')
    ]);

    if (orgError) {
      console.error('Error fetching organisations:', orgError);
    } else {
      setOrgs(orgData || []);

      const sectorMap: Record<string, string[]> = {};
      progData?.forEach(p => {
        if (!sectorMap[p.organisation_id]) sectorMap[p.organisation_id] = [];
        const sectorName = SECTOR_NAMES[p.sector_id];
        if (sectorName && !sectorMap[p.organisation_id].includes(sectorName)) {
          sectorMap[p.organisation_id].push(sectorName);
        }
      });
      setOrgSectors(sectorMap);

      const stateMap: Record<string, string[]> = {};
      const lgaMap: Record<string, string[]> = {};
      const sToLMap: Record<string, string[]> = {};
      const progToOrg: Record<number, string> = {};
      progData?.forEach(p => { progToOrg[p.id] = p.organisation_id; });

      lgaData?.forEach(pl => {
        const orgId = progToOrg[pl.programme_id];
        const state = (pl.lga_gap_scores as any)?.state;
        const lgaName = (pl.lga_gap_scores as any)?.name;

        if (state && lgaName) {
          if (!sToLMap[state]) sToLMap[state] = [];
          if (!sToLMap[state].includes(lgaName)) sToLMap[state].push(lgaName);
        }

        if (orgId) {
          if (!stateMap[orgId]) stateMap[orgId] = [];
          if (state && !stateMap[orgId].includes(state)) stateMap[orgId].push(state);
          if (!lgaMap[orgId]) lgaMap[orgId] = [];
          if (lgaName && !lgaMap[orgId].includes(lgaName)) lgaMap[orgId].push(lgaName);
        }
      });
      setOrgStates(stateMap);
      setOrgLgas(lgaMap);
      setStateToLgas(sToLMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrgs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrgs]);

  const filteredOrgs = orgs.filter(org => {
    const matchSearch =
      org.legal_name.toLowerCase().includes(search.toLowerCase()) ||
      org.description?.toLowerCase().includes(search.toLowerCase());
    const sectors = orgSectors[org.id] || [];
    const matchSector = selectedSectors.length === 0 || selectedSectors.some(s => sectors.includes(s));
    const matchTrust = !verifiedOnly || org.trust_tier === 'verified';
    const states = orgStates[org.id] || [];
    const matchState = !selectedState || states.includes(selectedState);
    const lgas = orgLgas[org.id] || [];
    const matchLga = !selectedLga || lgas.includes(selectedLga);
    return matchSearch && matchSector && matchTrust && matchState && matchLga;
  });

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = filteredOrgs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-grow relative min-h-0 overflow-hidden">
        {/* ── Floating Command Bar (Top) ────────────────────────────────────── */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[1000] flex gap-2">
          <div className="flex-grow relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search NGOs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3.5 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-sm font-medium"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className={`px-4 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 hover:bg-slate-50 transition-all flex items-center gap-2 ${(selectedSectors.length > 0 || selectedState || selectedLga || !verifiedOnly) ? 'text-emerald-600' : 'text-slate-600'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filters</span>
            {(selectedSectors.length > 0 || selectedState || selectedLga || !verifiedOnly) && (
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {(selectedSectors.length > 0 ? 1 : 0) + (selectedState ? 1 : 0) + (selectedLga ? 1 : 0) + (!verifiedOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* ── Results Count Bento (Bottom Left) ─────────────────────── */}
        <div className="absolute bottom-10 left-6 z-[1000] hidden xl:block">
          <motion.div 
            layout
            className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-slate-200/60 w-64 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Registry Stats</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orgs</div>
                <div className="text-xl font-black text-slate-900">{filteredOrgs.length}</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-grow relative bg-slate-50 h-full">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto pt-24"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <BrandLoader size="lg" />
                  <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading registry...</p>
                </div>
              ) : filteredOrgs.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {paginatedOrgs.map((org) => (
                        <motion.div
                          key={org.id}
                          variants={cardVariants}
                          layout
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col group/card-container"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative group-hover/card-container:scale-105 transition-transform shrink-0">
                              {org.logo_url ? (
                                <Image src={org.logo_url} alt={org.legal_name} fill className="object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Users className="text-slate-400 w-7 h-7 sm:w-8 sm:h-8" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap ml-2">
                              <ShieldCheck className="w-3 h-3" />
                              {org.trust_tier}
                            </div>
                          </div>

                          <Link href={`/org/${org.slug}`} className="group/card">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover/card:text-emerald-600 transition-colors break-words leading-tight">{org.legal_name}</h3>
                          </Link>
                          <p className="text-slate-500 text-sm mb-4 font-mono uppercase tracking-tight">CAC: {org.cac_number}</p>
                          <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">
                            {org.description || 'No description provided.'}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {(orgSectors[org.id] || []).map(s => (
                              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded">
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                              <MapPin className="w-4 h-4" />
                              {(orgStates[org.id] || []).length > 0
                                ? (orgStates[org.id] || []).slice(0, 2).join(', ') + ((orgStates[org.id] || []).length > 2 ? '...' : '')
                                : 'Nigeria'}
                            </div>
                            {org.website && (
                              <a
                                href={org.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                              >
                                Website
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

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
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No organisations found</h3>
                  <p className="text-slate-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Refine Registry</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(''); setCurrentPage(1); }}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">All States</option>
                        {Array.from(new Set(Object.values(orgStates).flat())).sort().map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">LGA</label>
                      <select
                        value={selectedLga}
                        onChange={(e) => { setSelectedLga(e.target.value); setCurrentPage(1); }}
                        disabled={!selectedState}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                      >
                        <option value="">All LGAs</option>
                        {(selectedState ? (stateToLgas[selectedState] || []) : []).sort().map(lga => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sectors</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(SECTOR_NAMES).map(sector => {
                        const isSelected = selectedSectors.includes(sector);
                        return (
                          <button
                            key={sector}
                            onClick={() => {
                              setSelectedSectors(prev =>
                                prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
                              );
                              setCurrentPage(1);
                            }}
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
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold">Verified Partners Only</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Filter by trust tier</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setVerifiedOnly(!verifiedOnly); setCurrentPage(1); }}
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
      </div>
    </main>
  );
}
