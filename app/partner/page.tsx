'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { Handshake, Globe, Zap, Users, ArrowRight } from 'lucide-react';

export default function PartnerPage() {
  const partnerTypes = [
    {
      title: "Donors & Foundations",
      description: "Use our intelligence to identify high-impact funding opportunities and track the effectiveness of your grants.",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Government Agencies",
      description: "Collaborate on national humanitarian strategy and integrate our data into your social welfare programmes.",
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "NGOs & Civil Society",
      description: "Join the registry to increase your visibility, find coordination partners, and access shared resources.",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-20">
            <h1 className="text-5xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">Partner With Whitespace</h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              We believe that coordination is the foundation of impact. 
              Join our ecosystem of institutional partners to build a more effective humanitarian landscape in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {partnerTypes.map((type, idx) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 ${type.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <type.icon className={`w-8 h-8 ${type.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{type.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  {type.description}
                </p>
                <button className="flex items-center gap-2 text-slate-900 font-bold text-sm hover:text-emerald-600 transition-colors">
                  Learn More <ArrowRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="bg-emerald-600 rounded-[3rem] p-12 md:p-24 text-white flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-6 leading-tight">Start a Strategic Partnership</h2>
              <p className="text-emerald-50 text-xl opacity-90 leading-relaxed">
                Our team is ready to discuss how Whitespace can support your organisation&apos;s mission through data and coordination.
              </p>
            </div>
            <div className="w-full lg:w-auto">
              <a href="mailto:partnerships@whitespace.org" className="block w-full text-center bg-white text-emerald-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:scale-105 transition-all shadow-xl shadow-emerald-700/20">
                Contact Partnerships Team
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
