'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Info, Layers, Filter, AlertTriangle, Loader2, Search, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = NextDynamic(() => import('@/components/LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading Coordination Map...</p>
      </div>
    </div>
  )
});

export default function MapPage() {
  const [loading, setLoading] = useState(true);
  const [lgas, setLgas] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [hoveredLga, setHoveredLga] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Health', 'Education', 'WASH', 'Nutrition', 'Protection']);

  const activeLga = selectedLga || hoveredLga;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch LGAs
      const { data: lgaData, error: lgaError } = await supabase
        .from('lga_data')
        .select('*');
      
      if (lgaError) console.error('Error fetching LGAs:', lgaError);
      else setLgas(lgaData || []);

      // Fetch Programmes
      const { data: progData, error: progError } = await supabase
        .from('programmes')
        .select('*, organisations(legal_name)');
      
      if (progError) console.error('Error fetching programmes:', progError);
      else setProgrammes(progData || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate stats for active LGA using useMemo
  const stats = useMemo(() => {
    if (!activeLga) return null;

    const lgaProgrammes = programmes.filter(i => i.lga_id === activeLga.id);
    const uniqueOrgs = new Set(lgaProgrammes.map(i => i.organisation_id)).size;
    
    const sectors = ['Health', 'Education', 'WASH', 'Nutrition', 'Protection'];
    const coveredSectors = new Set(lgaProgrammes.map(i => i.sector));
    const gaps = sectors.filter(s => !coveredSectors.has(s));

    return {
      orgCount: uniqueOrgs,
      progCount: lgaProgrammes.length,
      primaryGap: gaps[0] || 'None'
    };
  }, [activeLga, programmes]);

  const states = useMemo(() => Array.from(new Set(lgas.map(l => l.state))).sort(), [lgas]);
  
  const filteredLgas = useMemo(() => {
    return lgas.filter(lga => {
      const matchesSearch = lga.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            lga.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = !selectedState || lga.state === selectedState;
      
      const matchesSector = selectedSectors.length === 0 || 
                            programmes.some(p => p.lga_id === lga.id && selectedSectors.includes(p.sector));
      
      return matchesSearch && matchesState && matchesSector;
    });
  }, [lgas, searchTerm, selectedState, selectedSectors, programmes]);

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  return (
    <main className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar / Controls */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
              WHITESPACE
            </span>
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search LGA or State..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All States</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sectors</label>
                <div className="flex flex-wrap gap-2">
                  {['Health', 'Education', 'WASH', 'Nutrition', 'Protection'].map(sector => (
                    <label 
                      key={sector} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium cursor-pointer transition-all ${
                        selectedSectors.includes(sector) 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={selectedSectors.includes(sector)}
                        onChange={() => handleSectorToggle(sector)}
                      />
                      {sector}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Gap Alerts */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                Intelligence Alert
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                {lgas.filter(l => l.gap_score > 0.8).length} LGAs show critical gaps in programmes despite high need scores.
              </p>
              <button className="mt-3 text-xs font-bold text-amber-900 underline">View Gaps</button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all">
              <Layers className="w-4 h-4" />
              Layer Settings
            </button>
          </div>
        </aside>

        <div className="flex-grow flex flex-col relative overflow-hidden">
          <Navbar hideLogo={true} />
          
          {/* Map Viewport */}
          <div className="flex-grow relative bg-slate-200">
            <LeafletMap lgas={filteredLgas} onSelectLga={setSelectedLga} onHoverLga={setHoveredLga} />

          {/* Floating Legend */}
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 z-[1000] max-w-[200px]">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Need Intensity</h3>
            <div className="space-y-2">
              {[
                { label: 'Critical', color: 'bg-red-700' },
                { label: 'High', color: 'bg-red-500' },
                { label: 'Moderate', color: 'bg-orange-400' },
                { label: 'Low-Mid', color: 'bg-yellow-400' },
                { label: 'Low', color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-medium text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Info className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* LGA Info Card (Floating) */}
          <AnimatePresence mode="wait">
            {activeLga && stats && (
              <motion.div
                key={activeLga.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute top-6 left-6 w-80 z-[1000]"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{activeLga.name}</h2>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        activeLga.gap_score > 0.7 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {activeLga.gap_score > 0.7 ? 'Critical Gap' : 'Stable'}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{activeLga.state} State</p>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active NGOs</div>
                        <div className="text-lg font-bold text-slate-900">{stats.orgCount}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Programmes</div>
                        <div className="text-lg font-bold text-slate-900">{stats.progCount}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Need Intensity</span>
                        <span className="text-xs font-bold text-slate-900">{(activeLga.gap_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            activeLga.gap_score > 0.7 ? 'bg-red-500' : 
                            activeLga.gap_score > 0.4 ? 'bg-orange-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${activeLga.gap_score * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Primary Service Gap</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <AlertTriangle className="w-4 h-4" />
                        {stats.primaryGap}
                      </div>
                    </div>
                  </div>

                  {selectedLga && (
                    <button 
                      onClick={() => setSelectedLga(null)}
                      className="w-full py-3 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Deselect LGA
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
