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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

      <div className="flex-grow relative min-h-0">
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
          className="absolute top-0 left-0 w-[320px] max-w-[66%] sm:w-80 h-full bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col z-[1050] shadow-2xl"
        >
          {/* Sidebar Toggle Button */}
          <div className="absolute top-6 left-full z-[1060]">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2.5 bg-white/90 backdrop-blur-md rounded-r-xl shadow-lg border-y border-r border-slate-200 hover:bg-slate-50 transition-all text-slate-600 ${
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
                  {Array.from(new Set(Object.values(orgStates).flat())).sort().map(state => (
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
                  {(selectedState ? (stateToLgas[selectedState] || []) : []).sort().map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search NGOs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trust Tier</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setVerifiedOnly(!verifiedOnly); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                    verifiedOnly
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                    verifiedOnly
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-300 text-transparent'
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                  Verified Only
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Results</div>
                <div className="text-2xl font-bold text-slate-900">{filteredOrgs.length}</div>
                <div className="text-[10px] text-slate-400">organisations found</div>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex-grow relative bg-slate-50 h-full">
          <div 
            ref={scrollContainerRef}
            className={`h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen && !isMobile ? 'pl-80' : isSidebarOpen && isMobile ? 'pl-[max(50%,280px)]' : ''}`} 
            style={{ paddingLeft: isSidebarOpen && !isMobile ? '320px' : isSidebarOpen && isMobile ? 'min(50%, 280px)' : '0' }}
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