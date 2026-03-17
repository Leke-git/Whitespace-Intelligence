'use client';

import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, MapPin, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative py-20 overflow-hidden bg-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" />
              National Coordination Intelligence
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Eliminate Duplication. <br />
              <span className="text-emerald-600">Map the Gaps.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Whitespace is Nigeria&apos;s coordination platform for civil society. We use intelligence to ensure every programme reaches the LGAs that need them most.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/map"
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                Explore the Map
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/registry"
                className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                NGO Registry
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
          >
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <MapPin className="text-emerald-600 w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-slate-900">774</div>
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">LGAs Mapped</div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="text-blue-600 w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-slate-900">1,200+</div>
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Verified NGOs</div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="text-amber-600 w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-slate-900">85%</div>
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Coordination Efficiency</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
