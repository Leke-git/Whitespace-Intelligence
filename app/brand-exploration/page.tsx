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

        <section className="space-y-12 mb-20">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Concept Exploration: The Network &apos;W&apos;</h2>
            <p className="text-slate-500">Exploring different dot densities, sizes, and arrangements for the network concept.</p>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {/* Final Selection: Minimalist Path */}
            <div className="space-y-6">
              <div className="bg-white p-12 rounded-3xl border-2 border-emerald-600 shadow-lg flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Selected Brand Identity</div>
                <div className="flex items-center gap-6">
                  <BrandLoader size="lg" variant="dots" subVariant="minimal" isStatic={true} />
                  <span className="text-4xl font-bold tracking-tight text-slate-900 font-display uppercase">WHITESPACE</span>
                </div>
                <div className="mt-12 text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">Minimalist Network Path</div>
              </div>
              <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto">
                Our finalized identity. A simplified, abstract path that removes all visual noise to focus on the essential &quot;W&quot; shape, representing the seamless coordination of Nigeria&apos;s actors.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 mb-20">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Identity Preview</h2>
            <div className="flex flex-wrap justify-center gap-12 mb-6">
              <div className="flex flex-col items-center gap-3">
                <BrandLoader size="lg" variant="dots" subVariant="minimal" isStatic={true} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Icon Only (Static)</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <BrandLoader size="lg" variant="dots" subVariant="minimal" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Icon Only (Animated)</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Loader Variations (Selected Concept)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="sm" variant="dots" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Small (Navbar)</span>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="md" variant="dots" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medium (Default)</span>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <BrandLoader size="lg" variant="dots" />
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
