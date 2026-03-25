'use client';

export const dynamic = 'force-dynamic';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Plus, Minus, Map as MapIcon, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { BrandLoader } from '@/components/BrandLoader';

import Footer from '@/components/Footer';
import Image from 'next/image';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function Home() {
  const partners = [
    { name: "National Bureau of Statistics", logo: "https://unavatar.io/clearbit/nigerianstat.gov.ng" },
    { name: "USAID Nigeria", logo: "https://unavatar.io/clearbit/usaid.gov" },
    { name: "Bill & Melinda Gates Foundation", logo: "https://unavatar.io/clearbit/gatesfoundation.org" },
    { name: "UN OCHA", logo: "https://unavatar.io/clearbit/unocha.org" },
    { name: "Save the Children", logo: "https://unavatar.io/clearbit/savethechildren.org" },
    { name: "Dangote Group", logo: "https://unavatar.io/clearbit/dangote.com" },
    { name: "World Bank", logo: "https://unavatar.io/clearbit/worldbank.org" },
    { name: "European Union", logo: "https://unavatar.io/clearbit/europa.eu" }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Whitespace?",
      answer: "Whitespace is Nigeria's central coordination intelligence platform for civil society. We map NGO programmes across all 774 LGAs to identify service gaps."
    },
    {
      question: "How do I register my NGO?",
      answer: "To register, click the 'Register NGO' button above. You will need to provide your CAC registration details and institutional information."
    },
    {
      question: "Is the data on Whitespace verified?",
      answer: "Yes. Every organisation on our platform undergoes a verification process that includes CAC documentation checks and institutional vetting."
    }
  ];
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

      {/* Partner Spotlight Ribbon */}
      <div className="py-12 bg-white border-y border-slate-100 overflow-hidden">
        <div className="flex whitespace-nowrap animate-scroll">
          {[...partners, ...partners].map((partner, idx) => (
            <div key={idx} className="flex items-center gap-4 px-12 transition-all hover:scale-105">
              <div className="relative w-32 h-12">
                <Image 
                  src={partner.logo} 
                  alt={partner.name}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>

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
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
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

      {/* Video Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How to Use Whitespace</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A quick guide to navigating the platform, mapping your programmes, and accessing coordination intelligence.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-all flex items-center justify-center z-10">
                <button className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-emerald-600/40">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
                </button>
              </div>
              <Image 
                src="https://picsum.photos/seed/tutorial/1280/720" 
                alt="Tutorial Thumbnail"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[
                { title: "1. Register & Verify", desc: "Create your institutional profile and upload CAC documents for verification." },
                { title: "2. Log Programmes", desc: "Map your active interventions across 774 LGAs with precise sector data." },
                { title: "3. Access Intelligence", desc: "Use the Coordination Map to identify gaps and optimize your impact." }
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Quick answers to common questions about Whitespace.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-900">{faq.question}</span>
                  <span className="text-emerald-600 transition-all duration-300">
                    {openFaq === idx ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-slate-600 text-sm leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/faq" className="text-emerald-600 font-bold hover:underline">
              View all FAQs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
