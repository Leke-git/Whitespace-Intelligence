'use client';

import Navbar from '@/components/Navbar';
import { BrandLoader } from '@/components/BrandLoader';
import { motion } from 'motion/react';
import { Square, Layout, Box, Grid } from 'lucide-react';

export default function BrandExplorationPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Branding & Loader Exploration</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Exploring new visual identities for Whitespace, moving from the &quot;Shield&quot; to a more abstract &quot;Box-in-Box&quot; representation of whitespace and coordination.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* Logo Concept */}
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Logo Concept: The Inset Box</h2>
            <div className="flex items-center gap-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </div>
                <p className="text-xs font-medium text-slate-500 text-center">Static Logo</p>
              </div>
              <div className="max-w-xs">
                <p className="text-slate-700 leading-relaxed">
                  Replacing the shield with a minimal square represents the &quot;Whitespace&quot; — the gaps we identify and fill. The inset box symbolizes the coordination and focus we bring to these gaps.
                </p>
              </div>
            </div>
          </div>

          {/* Loader Concept */}
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Loader Concept: Kinetic Coordination</h2>
            <div className="flex items-center gap-12">
              <div className="space-y-4">
                <BrandLoader size="lg" />
                <p className="text-xs font-medium text-slate-500 text-center">Active Loader</p>
              </div>
              <div className="max-w-xs">
                <p className="text-slate-700 leading-relaxed">
                  The moving inner box represents the dynamic nature of coordination — constantly scanning, identifying, and aligning resources across the landscape.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Loader Variations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="sm" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Small (Inline)</span>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="md" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medium (Default)</span>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="lg" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Large (Hero)</span>
            </div>
          </div>
        </section>

        <section className="mt-20 pt-12 border-t border-slate-200">
          <div className="bg-slate-900 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Implementation Plan</h2>
            <ul className="space-y-4 text-slate-400">
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                <span>Update <strong>Navbar.tsx</strong> to use the new &quot;Box-in-Box&quot; logo.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
                <span>Replace generic Lucide spinners with <strong>BrandLoader</strong> in all loading states.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
                <span>Refine <strong>app/map/page.tsx</strong> UI to fix overlap and improve card transitions.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
