'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import NextDynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Info, Layers, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Dynamically import IntelligenceMap to avoid SSR issues
const IntelligenceMap = NextDynamic(() => import('@/components/IntelligenceMap'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#E4E3E0]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#141414] animate-spin mx-auto mb-4" />
        <p className="text-[#141414] font-mono uppercase text-xs tracking-widest">Initializing Intelligence Engine...</p>
      </div>
    </div>
  )
});

export default function MapPage() {
  const [loading, setLoading] = useState(true);
  const [lgas, setLgas] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedLga, setSelectedLga] = useState<any>(null);

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

  // Calculate stats for selected LGA using useMemo
  const stats = useMemo(() => {
    if (!selectedLga) return null;

    const lgaProgrammes = programmes.filter(i => i.lga_id === selectedLga.id);
    const uniqueOrgs = new Set(lgaProgrammes.map(i => i.organisation_id)).size;
    
    const sectors = ['Health', 'Education', 'WASH', 'Nutrition', 'Protection'];
    const coveredSectors = new Set(lgaProgrammes.map(i => i.sector));
    const gaps = sectors.filter(s => !coveredSectors.has(s));

    return {
      orgCount: uniqueOrgs,
      progCount: lgaProgrammes.length,
      primaryGap: gaps[0] || 'None'
    };
  }, [selectedLga, programmes]);

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="flex-grow flex relative overflow-hidden">
        {/* Sidebar / Controls */}
        <aside className="w-80 bg-[#E4E3E0] border-r border-[#141414] flex flex-col z-10 shadow-xl">
          <div className="p-6 border-b border-[#141414]">
            <h1 className="text-xl font-serif italic text-[#141414] flex items-center gap-2">
              <MapIcon className="text-[#141414] w-5 h-5" />
              Coordination Map
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">National Programme Density</p>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-8">
            {/* Legend */}
            <div>
              <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Need Intensity</h3>
              <div className="space-y-3">
                {[
                  { label: 'Critical (0.8 - 1.0)', color: 'bg-[#fee2e2]' },
                  { label: 'High (0.6 - 0.8)', color: 'bg-[#fed7aa]' },
                  { label: 'Moderate (0.4 - 0.6)', color: 'bg-[#fef08a]' },
                  { label: 'Low-Mid (0.2 - 0.4)', color: 'bg-[#dcfce7]' },
                  { label: 'Low (0.0 - 0.2)', color: 'bg-[#f1f5f9]' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 border border-[#141414] ${item.color}`} />
                    <span className="text-xs font-mono text-[#141414]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Sectors</h3>
              <div className="space-y-2">
                {['Health', 'Education', 'WASH', 'Nutrition', 'Protection'].map((sector) => (
                  <label key={sector} className="flex items-center gap-3 p-2 hover:bg-[#141414] hover:text-[#E4E3E0] rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="w-4 h-4 border-[#141414] text-[#141414] focus:ring-0" defaultChecked />
                    <span className="text-xs font-mono font-bold uppercase">{sector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gap Alerts */}
            <div className="p-4 bg-[#141414] text-[#E4E3E0] border border-[#141414]">
              <div className="flex items-center gap-2 font-mono font-bold text-[10px] mb-2 uppercase tracking-tighter">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Intelligence Alert
              </div>
              <p className="text-[11px] font-mono leading-relaxed opacity-80">
                {lgas.filter(l => l.gap_score > 0.8).length} LGAs show critical gaps in programmes despite high need scores.
              </p>
              <button className="mt-3 text-[10px] font-mono font-bold underline uppercase hover:text-red-400 transition-colors">View Gaps</button>
            </div>
          </div>

          <div className="p-4 border-t border-[#141414]">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#141414] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
              <Layers className="w-4 h-4" />
              Layer Settings
            </button>
          </div>
        </aside>

        {/* Map Viewport */}
        <div className="flex-grow relative bg-[#E4E3E0]">
          <IntelligenceMap lgas={lgas} onLgaSelect={setSelectedLga} selectedLgaId={selectedLga?.id} />

          {/* Floating Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Info className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Selected LGA Info Panel (Bottom) */}
          <AnimatePresence>
            {selectedLga && stats && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-[1000]"
              >
                <div className="bg-[#E4E3E0] border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-serif italic text-[#141414]">{selectedLga.name}</h2>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                        {selectedLga.state} State | Population: {selectedLga.population?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2 font-mono font-bold text-lg">
                      GAP: {(selectedLga.gap_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 border border-[#141414] bg-white">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Active NGOs</div>
                      <div className="text-2xl font-mono font-bold text-[#141414]">{stats.orgCount}</div>
                    </div>
                    <div className="p-4 border border-[#141414] bg-white">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Programmes</div>
                      <div className="text-2xl font-mono font-bold text-[#141414]">{stats.progCount}</div>
                    </div>
                    <div className="p-4 border border-[#141414] bg-[#141414] text-[#E4E3E0]">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Primary Gap</div>
                      <div className="text-xl font-mono font-bold uppercase tracking-tighter">{stats.primaryGap}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLga(null)}
                    className="mt-6 w-full text-center text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 hover:text-[#141414] transition-colors"
                  >
                    [ Close Intelligence Profile ]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
