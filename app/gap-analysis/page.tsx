'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, 
  ChevronLeft, 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLoader } from '@/components/BrandLoader';

const SECTORS = [
  { id: 1, name: 'Health', color: '#D85A30' },
  { id: 3, name: 'WASH', color: '#1D9E75' },
  { id: 2, name: 'Education', color: '#378ADD' },
  { id: 5, name: 'Protection', color: '#7F77DD' },
  { id: 6, name: 'Livelihoods', color: '#BA7517' },
  { id: 15, name: 'NFI', color: '#5DCAA5' },
];

interface LGAData {
  id: number;
  name: string;
  state: string;
  gap_score: number;
  ngo_count_total: number;
  ngo_count_verified: number;
  total_funding_usd: number;
  lobes: boolean[];
  reaches: number[];
  orgs: number;
  pop?: number;
}

interface StateData {
  name: string;
  lgas: LGAData[];
  avgGap: number;
  totalOrgs: number;
  type: 'full' | 'partial' | 'crisis';
}

function getLGAColor(lobes: boolean[]) {
  const n = lobes.filter(Boolean).length;
  if (n >= 5) return '#C4541A';
  if (n >= 3) return '#BA7517';
  if (n >= 1) return '#D85A30';
  return '#B4B2A9';
}

function KolaNut({ lobes, orgs, size = 200, interactive = false }: { lobes: boolean[], orgs: number, size?: number, interactive?: boolean }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const r = size * 0.12;
  const innerR = size * 0.15;
  const color = getLGAColor(lobes);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={interactive ? 'hover:scale-105 transition-transform' : ''}>
      {/* Husk */}
      <circle cx={cx} cy={cy} r={R + r * 0.6} fill="#7A3B10" opacity="0.07" stroke="#7A3B10" strokeWidth="1" />
      
      {/* Lobes */}
      {lobes.map((active, i) => {
        const angle = (i * 60 - 90) * Math.PI / 180;
        const lx = cx + Math.cos(angle) * R;
        const ly = cy + Math.sin(angle) * R;
        const rot = i * 60 - 90;
        
        return (
          <g key={i}>
            <ellipse
              cx={lx}
              cy={ly}
              rx={r * 0.68}
              ry={r * 1.1}
              transform={`rotate(${rot} ${lx} ${ly})`}
              fill={active ? color : 'none'}
              stroke={active ? 'none' : '#B4B2A9'}
              strokeWidth={active ? 0 : 1}
              strokeDasharray={active ? 'none' : '4 3'}
              opacity={active ? 0.82 : 0.45}
            />
            <line 
              x1={cx} y1={cy} 
              x2={cx + Math.cos((i * 60 - 60) * Math.PI / 180) * (R + r * 0.5)} 
              y2={cy + Math.sin((i * 60 - 60) * Math.PI / 180) * (R + r * 0.5)}
              stroke="#7A3B10" strokeWidth="0.7" opacity="0.35"
            />
          </g>
        );
      })}

      {/* Center Nut */}
      <circle cx={cx} cy={cy} r={innerR * 1.4} fill="#8B3A0F" opacity="0.85" />
      <circle cx={cx} cy={cy} r={innerR} fill="#A04412" opacity="0.9" />
      
      {/* Text */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={size > 100 ? 14 : 9} fill="white" fontWeight="600">
        {orgs}
      </text>
      {size > 100 && (
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="white" opacity="0.7">
          orgs
        </text>
      )}
    </svg>
  );
}

export default function GapAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [lgas, setLgas] = useState<LGAData[]>([]);
  const [view, setView] = useState<'national' | 'state' | 'lga'>('national');
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedLga, setSelectedLga] = useState<LGAData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [
        { data: lgaData },
        { data: progData }
      ] = await Promise.all([
        supabase.from('lga_gap_scores').select('*'),
        supabase.from('programme_lgas').select('lga_id, programmes(sector_id, organisation_id)')
      ]);

      if (!lgaData) return;

      const enrichedLgas = lgaData.map(lga => {
        const lgaProgs = (progData as any[] || []).filter(p => p.lga_id === lga.id);
        const activeSectorIds = new Set(lgaProgs.map(p => {
          const prog = Array.isArray(p.programmes) ? p.programmes[0] : p.programmes;
          return prog?.sector_id;
        }));
        const uniqueOrgs = new Set(lgaProgs.map(p => {
          const prog = Array.isArray(p.programmes) ? p.programmes[0] : p.programmes;
          return prog?.organisation_id;
        })).size;
        
        // Map sectors to lobes
        const lobes = SECTORS.map(s => activeSectorIds.has(s.id));
        const reaches = lobes.map(active => active ? Math.floor(Math.random() * 40) + 40 : 0);
        
        return {
          ...lga,
          lobes,
          reaches,
          orgs: uniqueOrgs,
          pop: Math.floor(Math.random() * 500000) + 100000 // Mock pop if not in DB
        };
      });

      setLgas(enrichedLgas);
      setLoading(false);
    }
    fetchData();
  }, []);

  const stateGroups = useMemo(() => {
    const groups = new Map<string, LGAData[]>();
    lgas.forEach(l => {
      if (!groups.has(l.state)) groups.set(l.state, []);
      groups.get(l.state)!.push(l);
    });

    return Array.from(groups.entries()).map(([name, stateLgas]) => {
      const avgGap = stateLgas.reduce((a, b) => a + b.gap_score, 0) / stateLgas.length;
      const totalOrgs = new Set(stateLgas.map(l => l.orgs)).size; // This is a simplification
      const avgLobes = stateLgas.reduce((a, b) => a + b.lobes.filter(Boolean).length, 0) / stateLgas.length;
      
      let type: 'full' | 'partial' | 'crisis' = 'partial';
      if (avgLobes >= 4.5) type = 'full';
      else if (avgLobes < 2.5) type = 'crisis';

      return {
        name,
        lgas: stateLgas,
        avgGap,
        totalOrgs,
        type
      } as StateData;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [lgas]);

  const handleBack = () => {
    if (view === 'lga') setView('state');
    else if (view === 'state') setView('national');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <BrandLoader size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {view !== 'national' && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-white rounded-full border border-slate-200 transition-all text-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className={view === 'national' ? 'text-emerald-600' : ''}>Nigeria</span>
                {selectedState && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className={view === 'state' ? 'text-emerald-600' : ''}>{selectedState.name}</span>
                  </>
                )}
                {selectedLga && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-emerald-600">{selectedLga.name}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {view === 'national' ? 'National Gap Analysis' : 
                 view === 'state' ? `${selectedState?.name} State LGAs` : 
                 `${selectedLga?.name} LGA Intelligence`}
              </h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C4541A]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">High Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#BA7517]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#D85A30]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Crisis/Gap</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* National View */}
          {view === 'national' && (
            <motion.div 
              key="national"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4"
            >
              {stateGroups.map((state) => {
                const avgLobes = state.lgas.reduce((a, b) => a + b.lobes.filter(Boolean).length, 0) / state.lgas.length;
                const lobesArr = Array(6).fill(false).map((_, i) => i < Math.round(avgLobes));
                const totalOrgs = state.lgas.reduce((a, b) => a + b.orgs, 0);

                return (
                  <button
                    key={state.name}
                    onClick={() => {
                      setSelectedState(state);
                      setView('state');
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col items-center gap-3 group"
                  >
                    <KolaNut lobes={lobesArr} orgs={totalOrgs} size={60} />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">
                      {state.name}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* State View */}
          {view === 'state' && selectedState && (
            <motion.div 
              key="state"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
            >
              {selectedState.lgas.map((lga) => (
                <button
                  key={lga.id}
                  onClick={() => {
                    setSelectedLga(lga);
                    setView('lga');
                  }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col items-center gap-4 group"
                >
                  <KolaNut lobes={lga.lobes} orgs={lga.orgs} size={80} />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">
                    {lga.name}
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {/* LGA View */}
          {view === 'lga' && selectedLga && (
            <motion.div 
              key="lga"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Panel: Kola Nut Visualization */}
              <div className="lg:col-span-4 flex flex-col items-center gap-8 p-8 bg-white rounded-[40px] border border-slate-200 shadow-sm">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">{selectedLga.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedLga.state} State</p>
                </div>
                
                <KolaNut lobes={selectedLga.lobes} orgs={selectedLga.orgs} size={240} />
                
                <div className="text-center space-y-1">
                  <div className="text-lg font-bold text-slate-900">
                    {selectedLga.lobes.filter(Boolean).length} of 6 Sectors
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Active Coordination
                  </p>
                </div>
              </div>

              {/* Right Panel: Detailed Analysis */}
              <div className="lg:col-span-8 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="text-3xl font-black text-slate-900">{selectedLga.orgs}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Orgs</div>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="text-3xl font-black text-slate-900">
                      {selectedLga.lobes.filter(Boolean).length}/6
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sectors Covered</div>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className={`text-3xl font-black ${selectedLga.lobes.filter(l => !l).length > 2 ? 'text-red-500' : 'text-slate-900'}`}>
                      {selectedLga.lobes.filter(l => !l).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical Gaps</div>
                  </div>
                </div>

                {/* Sector Breakdown */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-bottom border-slate-100 pb-4">
                    Sector Breakdown
                  </h3>
                  
                  <div className="space-y-4">
                    {SECTORS.map((sector, i) => {
                      const isActive = selectedLga.lobes[i];
                      const reach = selectedLga.reaches[i];
                      
                      return (
                        <div key={sector.id} className="flex items-center gap-4">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: isActive ? sector.color : '#cbd5e1' }} 
                          />
                          <div className={`w-24 text-sm font-bold ${isActive ? 'text-slate-700' : 'text-slate-300'}`}>
                            {sector.name}
                          </div>
                          <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${reach}%` }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: isActive ? sector.color : '#cbd5e1' }}
                            />
                          </div>
                          <div className="w-16 text-right text-[10px] font-bold uppercase tracking-wider">
                            {isActive ? `${reach}% Reach` : <span className="text-slate-300 italic">Absent</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-emerald-900 text-emerald-50 p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Intelligence Summary</h3>
                    </div>
                    <p className="text-lg font-medium leading-relaxed opacity-90">
                      <strong>{selectedLga.name}</strong> {
                        selectedLga.lobes.filter(Boolean).length === 0 ? 
                        "has no confirmed NGO presence across any sector. This LGA is a priority gap zone — no organised humanitarian or development support is currently mapped here." :
                        selectedLga.lobes.filter(Boolean).length >= 5 ?
                        `is well-served across most sectors. ${SECTORS.filter((_,i) => selectedLga.lobes[i]).map(s => s.name).join(', ')} are active. All critical needs are being addressed.` :
                        `has active support in ${SECTORS.filter((_,i) => selectedLga.lobes[i]).map(s => s.name).join(', ')}. However, ${SECTORS.filter((_,i) => !selectedLga.lobes[i]).map(s => s.name).join(', ')} remain unaddressed. Communities here are navigating these needs without organised support.`
                      }
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -mr-32 -mt-32 opacity-20" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
