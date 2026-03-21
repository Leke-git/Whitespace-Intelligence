'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ShieldCheck, ExternalLink, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function RegistryPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('trust_tier', 'verified')
      .order('legal_name');

    if (error) {
      console.error('Error fetching organisations:', error);
    } else {
      setOrgs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchOrgs();
    };
    loadData();
  }, [fetchOrgs]);

  const filteredOrgs = orgs.filter(org => 
    org.legal_name.toLowerCase().includes(search.toLowerCase()) ||
    org.description?.toLowerCase().includes(search.toLowerCase())
  );

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-12"
        >
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-5 h-5" />
            Filter Sectors
          </button>
        </motion.div>

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

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        Nigeria
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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
