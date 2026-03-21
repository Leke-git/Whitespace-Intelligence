'use client';

export const dynamic = 'force-dynamic';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Search, Map as MapIcon, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { BrandLoader } from '@/components/BrandLoader';

import { motion } from 'motion/react';

export default function Home() {
  const features = [
    {
      title: "Verified Registry",
      description: "Access a directory of NGOs verified through CAC documentation and institutional vetting.",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Coordination Maps",
      description: "Real-time visualization of programmes across all 774 LGAs to identify overlaps.",
      icon: MapIcon,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Gap Intelligence",
      description: "AI-powered analysis that flags underserved regions and critical service gaps.",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="flex-grow">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Institutional Coordination Tools</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Whitespace provides the infrastructure for civil society to work together effectively.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {features.map((feature) => (
              <motion.div 
                key={feature.title} 
                variants={itemVariants}
                className="group p-8 rounded-3xl hover:bg-slate-50 transition-all duration-500 border border-transparent hover:border-slate-100"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-emerald-600 rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-emerald-500/20"
          >
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-6">Ready to coordinate?</h2>
              <p className="text-emerald-50 text-xl opacity-90">
                Join over 1,200 organisations mapping their impact and identifying new opportunities for programmes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link
                href="/auth?mode=register"
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all text-center"
              >
                Register NGO
              </Link>
              <Link
                href="/map"
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 hover:scale-105 active:scale-95 transition-all text-center"
              >
                View Map
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BrandLoader size="sm" variant="dots" isStatic={true} />
              <span className="text-lg font-bold tracking-tight text-slate-900 font-display uppercase">
                WHITESPACE
              </span>
            </div>
            <div className="flex gap-8 text-slate-500 text-sm font-medium">
              <Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-emerald-600">Terms of Service</Link>
              <Link href="/contact" className="hover:text-emerald-600">Contact Support</Link>
            </div>
            <div className="text-slate-400 text-sm">
              © 2026 Whitespace Coordination Intelligence. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
