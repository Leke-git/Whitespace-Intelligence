'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { Heart, Zap, ShieldCheck, Target, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const amounts = [1000, 5000, 10000, 25000, 50000];

  const impactPoints = [
    {
      title: "Data Accuracy",
      description: "Support our field verification teams to ensure the NGO registry remains accurate and up-to-date.",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Gap Analysis",
      description: "Fund the development of our AI-powered intelligence tools to identify underserved regions.",
      icon: Target,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "Platform Scaling",
      description: "Help us scale our infrastructure to support more NGOs and coordination partners across Nigeria.",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                <Heart size={14} className="fill-current" /> Support Our Mission
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">Help Us Coordinate Humanitarian Impact</h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-12">
                Whitespace is a non-profit initiative. Your donations directly fund the data infrastructure that helps NGOs work together and reach the people who need it most.
              </p>

              <div className="grid grid-cols-1 gap-8">
                {impactPoints.map((point) => (
                  <div key={point.title} className="flex gap-6">
                    <div className={`w-12 h-12 ${point.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <point.icon className={`w-6 h-6 ${point.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{point.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-sm">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl shadow-slate-200/50"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Make a Donation</h2>
              
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  {amounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                      className={`py-4 rounded-2xl font-bold text-sm transition-all ${
                        selectedAmount === amount
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ₦{amount.toLocaleString()}
                    </button>
                  ))}
                  <div className="relative col-span-3">
                    <input
                      type="number"
                      placeholder="Custom Amount (₦)"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group">
                    Proceed to Payment
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center text-xs text-slate-400 font-medium">
                    Secure payment powered by Paystack. All donations are tax-deductible.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
