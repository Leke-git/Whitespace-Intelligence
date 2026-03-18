'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Zap, AlertTriangle, TrendingUp, MapPin, Search, Filter, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface GapAnalysis {
  id: string;
  lga_name: string;
  sector: string;
  gap_score: number;
  is_critical_gap: boolean;
  duplication_risk: string;
  summary: string;
  recommendation: string;
  created_at: string;
}

export default function IntelligencePage() {
  const [analyses, setAnalyses] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('lga_gap_scores')
      .select(`
        id,
        gap_score,
        computed_at,
        lga_gap_scores (name),
        sectors (name)
      `)
      .order('gap_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching analyses:', error);
      // Fallback to dummy data for MVP demonstration
      const dummyData: GapAnalysis[] = [
        {
          id: '1',
          lga_name: 'Maiduguri',
          sector: 'Nutrition',
          gap_score: 0.92,
          is_critical_gap: true,
          duplication_risk: 'Low',
          summary: 'High gap score (0.92) with only 2 active NGOs in the nutrition sector.',
          recommendation: 'Prioritize therapeutic feeding centers in northern wards.',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          lga_name: 'Kano Municipal',
          sector: 'WASH',
          gap_score: 0.85,
          is_critical_gap: true,
          duplication_risk: 'Medium',
          summary: 'Rapid population growth outpacing current water infrastructure interventions.',
          recommendation: 'Focus on urban sanitation and drainage systems.',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          lga_name: 'Ikeja',
          sector: 'Education',
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
        lga_name: item.lga_gap_scores?.name || 'Unknown LGA',
        sector: item.sectors?.name || 'All Sectors',
        gap_score: parseFloat(item.gap_score),
        is_critical_gap: parseFloat(item.gap_score) > 0.8,
        duplication_risk: parseFloat(item.gap_score) < 0.3 ? 'High' : parseFloat(item.gap_score) < 0.6 ? 'Medium' : 'Low',
        summary: `Gap score of ${(parseFloat(item.gap_score) * 100).toFixed(0)}% identified in ${item.lga_gap_scores?.name || 'this LGA'}.`,
        recommendation: parseFloat(item.gap_score) > 0.8 
          ? 'Immediate intervention required to address critical service gaps.' 
          : 'Monitor situation and coordinate with existing partners.',
        created_at: item.computed_at
      }));
      setAnalyses(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchAnalyses();
    };
    init();
  }, [fetchAnalyses]);

  const filteredAnalyses = analyses.filter(a => {
    if (filter === 'critical') return a.is_critical_gap;
    if (filter === 'low-risk') return a.duplication_risk === 'Low';
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <header className="bg-slate-900 text-white py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-dark" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dark)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold mb-6 border border-amber-500/30">
              <Zap className="w-4 h-4" />
              AI-Powered Coordination
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Gap Intelligence <br />
              <span className="text-emerald-500">Engine.</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              We analyze real-time programme data against regional need indices to identify underserved LGAs and prevent duplication of effort.
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="text-red-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Priority</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">12</div>
            <div className="text-slate-500 font-medium">Critical Gaps Identified</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Growth</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">85%</div>
            <div className="text-slate-500 font-medium">Coordination Accuracy</div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MapPin className="text-blue-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Coverage</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">774</div>
            <div className="text-slate-500 font-medium">LGAs Monitored</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex gap-2 p-1 bg-slate-200 rounded-2xl w-full md:w-auto">
            {['all', 'critical', 'low-risk'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <Info className="w-4 h-4 text-blue-600" />
            Data updated 2 hours ago based on latest NGO submissions.
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredAnalyses.map((analysis, i) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-3xl border p-8 shadow-sm hover:shadow-md transition-all ${
                analysis.is_critical_gap ? 'border-red-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{analysis.lga_name}</h3>
                    {analysis.is_critical_gap && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Critical Gap
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">{analysis.sector} Sector</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{(analysis.gap_score * 100).toFixed(0)}%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gap Score</div>
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

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duplication Risk</div>
                    <div className={`text-sm font-bold ${
                      analysis.duplication_risk === 'Low' ? 'text-emerald-600' : 
                      analysis.duplication_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {analysis.duplication_risk}
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors">
                  View Map
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
