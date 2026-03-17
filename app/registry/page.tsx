'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ShieldCheck, ExternalLink, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface Organisation {
  id: string;
  legal_name: string;
  cac_number: string;
  trust_tier: string;
  description: string;
  email: string;
  website: string;
  logo_url: string;
}

export default function RegistryPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <header className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Verified NGO Registry</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            A directory of civil society organisations verified through institutional vetting and CAC documentation.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-5 h-5" />
            Filter Sectors
          </button>
        </div>

        {/* Registry Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredOrgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrgs.map((org) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative">
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
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{org.legal_name}</h3>
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
          </div>
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
