'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ShieldCheck, ExternalLink, MapPin, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('');
  const [orgSectors, setOrgSectors] = useState<Record<string, string[]>>({});
  const [orgStates, setOrgStates] = useState<Record<string, string[]>>({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const [
      { data: orgData, error: orgError }, 
      { data: progData, error: progError },
      { data: lgaData, error: lgaError }
    ] = await Promise.all([
      supabase
        .from('organisations')
        .select('*')
        .eq('trust_tier', 'verified')
        .order('legal_name'),
      supabase
        .from('programmes')
        .select('organisation_id, sector_id, id'),
      supabase
        .from('programme_lgas')
        .select('programme_id, lga_id, lga_gap_scores(state)')
    ]);

    if (orgError) {
      console.error('Error fetching organisations:', orgError);
    } else {
      setOrgs(orgData || []);
      
      // Map sectors to orgs
      const sectorMap: Record<string, string[]> = {};
      progData?.forEach(p => {
        if (!sectorMap[p.organisation_id]) sectorMap[p.organisation_id] = [];
        const sectorName = SECTOR_NAMES[p.sector_id];
        if (sectorName && !sectorMap[p.organisation_id].includes(sectorName)) {
          sectorMap[p.organisation_id].push(sectorName);
        }
      });
      setOrgSectors(sectorMap);

      // Map states to orgs
      const stateMap: Record<string, string[]> = {};
      const progToOrg: Record<number, string> = {};
      progData?.forEach(p => { progToOrg[p.id] = p.organisation_id; });

      lgaData?.forEach(pl => {
        const orgId = progToOrg[pl.programme_id];
        if (orgId) {
          if (!stateMap[orgId]) stateMap[orgId] = [];
          const state = (pl.lga_gap_scores as any)?.state;
          if (state && !stateMap[orgId].includes(state)) {
            stateMap[orgId].push(state);
          }
        }
      });
      setOrgStates(stateMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchOrgs();
    };
    loadData();
  }, [fetchOrgs]);

  const filteredOrgs = orgs.filter(org => {
    const matchSearch = 
      org.legal_name.toLowerCase().includes(search.toLowerCase()) ||
      org.description?.toLowerCase().includes(search.toLowerCase());
    
    const sectors = orgSectors[org.id] || [];
    const matchSector = selectedSector === 'all' || sectors.includes(selectedSector);

    const states = orgStates[org.id] || [];
    const matchState = !selectedState || states.includes(selectedState);

    return matchSearch && matchSector && matchState;
  });

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = filteredOrgs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <header className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-slate-900 mb-4"
          >
            Verified NGO Registry
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            A directory of civil society organisations verified through institutional vetting and CAC documentation.
          </motion.p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="sticky top-[64px] z-30 bg-slate-50/80 backdrop-blur-md py-6 mb-12 border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between lg:hidden">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {filteredOrgs.length} Organisations
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
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
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
                {Array.from(new Set(Object.values(orgStates).flat())).sort().map(state => (
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
                <button
                  className="whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-slate-900 shadow-sm"
                >
                  Verified Only
                </button>
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
                        placeholder="Search NGOs..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
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
                      {Array.from(new Set(Object.values(orgStates).flat())).sort().map(state => (
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        className="w-full text-left px-4 py-3 rounded-xl font-medium transition-all bg-slate-900 text-white"
                      >
                        Verified Only
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100">
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                  >
                    Show {filteredOrgs.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Registry Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BrandLoader size="lg" />
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading registry...</p>
          </div>
        ) : filteredOrgs.length > 0 ? (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {paginatedOrgs.map((org) => (
                  <motion.div
                    key={org.id}
                    variants={cardVariants}
                    layout
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col group/card-container"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative group-hover/card-container:scale-105 transition-transform">
                        {org.logo_url ? (
                          <Image src={org.logo_url} alt={org.legal_name} fill className="object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users className="text-slate-400 w-8 h-8" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        {org.trust_tier}
                      </div>
                    </div>
                    
                    <Link href={`/org/${org.slug}`} className="group/card">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover/card:text-emerald-600 transition-colors">{org.legal_name}</h3>
                    </Link>
                    <p className="text-slate-500 text-sm mb-4 font-mono uppercase tracking-tight">CAC: {org.cac_number}</p>
                    <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">
                      {org.description || "No description provided."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {(orgSectors[org.id] || []).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MapPin className="w-4 h-4" />
                          {(orgStates[org.id] || []).length > 0 
                            ? (orgStates[org.id] || []).slice(0, 2).join(', ') + ((orgStates[org.id] || []).length > 2 ? '...' : '')
                            : 'Nigeria'}
                        </div>
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
              </AnimatePresence>
            </motion.div>

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
                  {/* Logic for compact pagination */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      
                      if (currentPage > 3) {
                        pages.push('...');
                      }
                      
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== totalPages) pages.push(i);
                      }
                      
                      if (currentPage < totalPages - 2) {
                        pages.push('...');
                      }
                      
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
    </main>
  );
}
