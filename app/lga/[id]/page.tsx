'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, MapPin, Users, Activity, BarChart3, 
  ShieldCheck, ExternalLink, Info, AlertTriangle,
  HeartPulse, GraduationCap, Droplets, Utensils, Shield,
  ArrowUpRight, Building2, Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const SECTOR_ICONS: Record<string, any> = {
  'Health': HeartPulse,
  'Education': GraduationCap,
  'WASH': Droplets,
  'Nutrition': Utensils,
  'Protection': Shield,
};

const SECTOR_COLORS: Record<string, string> = {
  'Health': '#ef4444',
  'Education': '#3b82f6',
  'WASH': '#06b6d4',
  'Nutrition': '#f59e0b',
  'Protection': '#8b5cf6',
};

export default function LGADetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [lga, setLga] = useState<any>(null);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch LGA details
        const { data: lgaData, error: lgaError } = await supabase
          .from('lga_gap_scores')
          .select('*')
          .eq('id', id)
          .single();

        if (lgaError) throw lgaError;
        setLga(lgaData);

        // Fetch programmes in this LGA
        const { data: progData, error: progError } = await supabase
          .from('programme_lgas')
          .select(`
            lga_id,
            programme_id,
            programmes (
              id,
              organisation_id,
              status,
              sector_id,
              organisations (
                legal_name,
                slug,
                trust_tier,
                logo_url
              )
            )
          `)
          .eq('lga_id', id);

        if (progError) throw progError;
        setProgrammes(progData || []);
      } catch (err: any) {
        console.error('Error fetching LGA data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const sectorStats = useMemo(() => {
    const SECTOR_NAMES: Record<number, string> = {
      1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
    };
    
    const stats: Record<string, number> = {
      'Health': 0, 'Education': 0, 'WASH': 0, 'Nutrition': 0, 'Protection': 0
    };

    programmes.forEach(p => {
      const name = SECTOR_NAMES[p.programmes?.sector_id];
      if (name) stats[name]++;
    });

    return Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      color: SECTOR_COLORS[name]
    }));
  }, [programmes]);

  const gapAnalysis = useMemo(() => {
    if (!lga) return [];
    const SECTOR_NAMES: Record<number, string> = {
      1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection'
    };
    
    const coveredSectors = new Set(
      programmes.map(p => SECTOR_NAMES[p.programmes?.sector_id]).filter(Boolean)
    );

    return Object.values(SECTOR_NAMES).map(name => ({
      name,
      covered: coveredSectors.has(name),
      intensity: lga.need_index || 0, // Simplified: using global need index for all sectors
    }));
  }, [lga, programmes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 text-emerald-600 animate-pulse mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Analysing LGA Data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lga) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">LGA Not Found</h2>
            <p className="text-slate-600 mb-6">We couldn&apos;t find the coordination data for this area.</p>
            <Link href="/map" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">
              <ChevronLeft className="w-4 h-4" />
              Back to Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gapScore = parseFloat(lga.gap_score || 0);
  const needIndex = parseFloat(lga.need_index || 0);
  const ngoDensity = lga.ngo_count_verified || 0;

  return (
    <main className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      <Navbar />

      {/* Header */}
      <header className="border-b border-[#141414] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link href="/map" className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 hover:text-[#141414] transition-all mb-4">
                <ChevronLeft className="w-3 h-3" />
                Back to Coordination Map
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-tighter rounded">
                  {lga.state} State
                </span>
                <span className="text-[11px] font-mono opacity-50">ID: {lga.id}</span>
              </div>
              <h1 className="text-6xl font-bold tracking-tighter leading-none mb-2">
                {lga.name}
              </h1>
              <p className="text-lg font-serif italic opacity-70">
                Local Government Area Coordination Profile
              </p>
            </div>

            <div className="flex gap-4">
              <div className="text-right border-r border-[#141414]/10 pr-6">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Gap Score</div>
                <div className="text-4xl font-mono font-bold leading-none">
                  {(gapScore * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Population</div>
                <div className="text-4xl font-mono font-bold leading-none">
                  {lga.population?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Core Metrics */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Gap Analysis Section */}
            <section>
              <div className="flex items-center justify-between border-b border-[#141414] pb-2 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest">Strategic Gap Analysis</h2>
                <Info className="w-4 h-4 opacity-30" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/50 border border-[#141414]/5 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold mb-6">Need vs. Response Density</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Need Index', value: needIndex * 100, fill: '#ef4444' },
                        { name: 'NGO Density', value: (ngoDensity / 20) * 100, fill: '#10b981' },
                        { name: 'Gap Score', value: gapScore * 100, fill: '#141414' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#141414', border: 'none', borderRadius: '8px', color: '#E4E3E0'}}
                          itemStyle={{color: '#E4E3E0'}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          { [0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#10b981' : '#141414'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-[#141414]/60 mt-4 leading-relaxed">
                    The Gap Score is calculated by adjusting the baseline Need Index against the presence of verified CSOs. 
                    A score above 80% indicates a critical coordination priority.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold mb-4">Sector Coverage Status</h3>
                  <div className="space-y-2">
                    {gapAnalysis.map((sector) => {
                      const Icon = SECTOR_ICONS[sector.name] || Activity;
                      return (
                        <div key={sector.name} className="flex items-center justify-between p-3 bg-white/30 border border-[#141414]/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${sector.covered ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold">{sector.name}</div>
                              <div className="text-[10px] opacity-50">{sector.covered ? 'Covered by verified NGOs' : 'No verified coverage'}</div>
                            </div>
                          </div>
                          {sector.covered ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Active Organisations Section */}
            <section>
              <div className="flex items-center justify-between border-b border-[#141414] pb-2 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest">Verified Response Registry</h2>
                <div className="text-[11px] font-mono opacity-40">{programmes.length} Active Programmes</div>
              </div>

              <div className="space-y-4">
                {programmes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programmes.map((p, idx) => {
                      const org = p.programmes?.organisations;
                      const sectorMap: Record<number, string> = { 1: 'Health', 2: 'Education', 3: 'WASH', 4: 'Nutrition', 5: 'Protection' };
                      const sectorName = (p.programmes?.sector_id && sectorMap[p.programmes.sector_id as keyof typeof sectorMap]) || 'General';
                      const Icon = SECTOR_ICONS[sectorName] || Activity;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-white border border-[#141414]/10 p-5 rounded-2xl hover:border-[#141414] transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                                {org?.logo_url ? (
                                  <img src={org.logo_url} alt={org.legal_name} className="w-full h-full object-cover" />
                                ) : (
                                  <Building2 className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold group-hover:text-emerald-700 transition-colors">{org?.legal_name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    {org?.trust_tier}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/registry/${org?.slug}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                            <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold flex items-center gap-1.5">
                              <Icon className="w-3 h-3 opacity-50" />
                              {sectorName}
                            </div>
                            <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tighter">
                              {p.programmes?.status || 'Active'}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-white/20 border border-dashed border-[#141414]/20 rounded-2xl">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium opacity-40">No verified programmes currently registered in this LGA.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar Stats */}
          <div className="space-y-8">
            
            {/* Sector Distribution */}
            <div className="bg-[#141414] text-[#E4E3E0] p-8 rounded-3xl">
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-6">Response Distribution</h3>
              <div className="h-48 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorStats.filter(s => s.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {sectorStats.filter(s => s.count > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#E4E3E0', border: 'none', borderRadius: '8px', color: '#141414'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {sectorStats.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: sector.color}} />
                      <span className="opacity-70">{sector.name}</span>
                    </div>
                    <span className="font-mono font-bold">{sector.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 border border-[#141414] rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Coordination Actions</h3>
              <button className="w-full flex items-center justify-between p-4 bg-[#141414] text-[#E4E3E0] rounded-xl hover:opacity-90 transition-all">
                <span className="text-sm font-bold">Request Access</span>
                <Globe className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-[#141414] rounded-xl hover:bg-white transition-all">
                <span className="text-sm font-bold">Download Data</span>
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata */}
            <div className="p-6 bg-white/40 rounded-2xl">
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Data Integrity</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Verified Source</div>
                    <div className="text-[10px] opacity-50">Data cross-referenced with OCHA 3W and CAC records.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Last Updated</div>
                    <div className="text-[10px] opacity-50">{new Date(lga.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <footer className="border-t border-[#141414] py-12 bg-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-4">Strategic Coordination Initiative</p>
          <h2 className="text-3xl font-bold tracking-tighter mb-6">Bridging the Gap in {lga.name}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/registry" className="px-8 py-3 bg-[#141414] text-[#E4E3E0] rounded-xl font-bold hover:opacity-90 transition-all">
              View All Verified NGOs
            </Link>
            <Link href="/intelligence" className="px-8 py-3 border border-[#141414] rounded-xl font-bold hover:bg-white transition-all">
              Access Intelligence Reports
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
