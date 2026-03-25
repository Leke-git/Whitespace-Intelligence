'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { ShieldCheck, Database, Zap, Activity, Target, BarChart3 } from 'lucide-react';

export default function MethodologyPage() {
  const steps = [
    {
      title: "Data Aggregation",
      description: "We collect data from multiple sources: CAC registration, donor reports, government datasets, and NGO self-reported programme data.",
      icon: Database,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Verification & Vetting",
      description: "Every NGO in our registry undergoes a multi-stage verification process to ensure legal compliance and institutional legitimacy.",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Gap Score Calculation",
      description: "Our proprietary algorithm calculates 'Gap Scores' for each LGA by comparing population needs against active humanitarian interventions.",
      icon: Target,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "Duplication Analysis",
      description: "We identify areas where multiple NGOs are performing identical tasks, flagging potential resource waste and coordination opportunities.",
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-20">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Intelligence Methodology</h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Whitespace uses a data-driven approach to map, verify, and analyze the humanitarian landscape in Nigeria. 
              Our methodology ensures transparency, accuracy, and actionable insights for donors and NGOs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-10">
              <BarChart3 size={300} />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold mb-8">The Gap Score Algorithm</h2>
              <div className="space-y-6 text-slate-300 leading-relaxed">
                <p>
                  The Gap Score is a normalized metric from 0 to 1, where 1 represents a total absence of recorded services relative to the estimated population need.
                </p>
                <p>
                  Our algorithm weights factors such as:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-emerald-400 font-medium">
                  <li>LGA Population Density & Vulnerability Index</li>
                  <li>Number of Active NGOs per Sector</li>
                  <li>Total Funding Allocation per Capita</li>
                  <li>Historical Crisis Data & Security Status</li>
                </ul>
                <p className="pt-6 border-t border-slate-800 text-sm italic">
                  * Methodology updated annually in consultation with the National Bureau of Statistics and international humanitarian partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
