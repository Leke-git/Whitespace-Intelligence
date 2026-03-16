'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Info, Layers, Filter, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MapPage() {
  const [loading, setLoading] = useState(true);
  const [selectedLga, setSelectedLga] = useState<any>(null);

  // In a real implementation, we would initialize MapLibre GL here.
  // For the MVP build, we'll create a high-fidelity interactive placeholder.

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="flex-grow flex relative overflow-hidden">
        {/* Sidebar / Controls */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="text-emerald-600 w-5 h-5" />
              Coordination Map
            </h1>
            <p className="text-sm text-slate-500 mt-1">National Intervention Density</p>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-8">
            {/* Legend */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Need Intensity</h3>
              <div className="space-y-3">
                {[
                  { label: 'Critical (0.8 - 1.0)', color: 'bg-red-700' },
                  { label: 'High (0.6 - 0.8)', color: 'bg-red-500' },
                  { label: 'Moderate (0.4 - 0.6)', color: 'bg-orange-400' },
                  { label: 'Low-Mid (0.2 - 0.4)', color: 'bg-yellow-400' },
                  { label: 'Low (0.0 - 0.2)', color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-sm ${item.color}`} />
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sectors</h3>
              <div className="space-y-2">
                {['Health', 'Education', 'WASH', 'Nutrition', 'Protection'].map((sector) => (
                  <label key={sector} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" defaultChecked />
                    <span className="text-sm text-slate-700 font-medium">{sector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gap Alerts */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                Intelligence Alert
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                3 LGAs in Borno State show critical gaps in WASH interventions despite high need scores.
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

        {/* Map Viewport */}
        <div className="flex-grow relative bg-slate-200">
          {/* Map Placeholder Graphic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapIcon className="text-slate-400 w-10 h-10" />
              </div>
              <p className="text-slate-500 font-medium">Initializing Coordination Engine...</p>
              <p className="text-xs text-slate-400 mt-2">MapLibre GL | PMTiles | 774 LGAs</p>
            </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Info className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Selected LGA Info Panel (Bottom) */}
          <AnimatePresence>
            {selectedLga && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Maiduguri</h2>
                      <p className="text-slate-500">Borno State | Pop: 540,000</p>
                    </div>
                    <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold">
                      Need Index: 0.85
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Active NGOs</div>
                      <div className="text-xl font-bold text-slate-900">12</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Interventions</div>
                      <div className="text-xl font-bold text-slate-900">24</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Primary Gap</div>
                      <div className="text-xl font-bold text-emerald-600">WASH</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
