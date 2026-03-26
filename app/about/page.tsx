'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { PartnerLogo } from '@/components/PartnerLogo';
import { Users, Target, Shield, Globe, Linkedin, Twitter, Mail } from 'lucide-react';
import Image from 'next/image';

const team = [
  {
    name: "Dr. Amara Okafor",
    role: "Executive Director",
    bio: "Former UN humanitarian coordinator with 15 years of experience in West African crisis response.",
    image: "https://picsum.photos/seed/amara/400/400"
  },
  {
    name: "Ibrahim Yusuf",
    role: "Head of Data Intelligence",
    bio: "Data scientist specializing in geospatial analysis and predictive modeling for social impact.",
    image: "https://picsum.photos/seed/ibrahim/400/400"
  },
  {
    name: "Sarah Chen",
    role: "Director of Partnerships",
    bio: "Expert in institutional fundraising and cross-sector collaboration between NGOs and government.",
    image: "https://picsum.photos/seed/sarah/400/400"
  }
];

const partners = [
  { name: "National Bureau of Statistics", logo: "https://unavatar.io/clearbit/nigerianstat.gov.ng" },
  { name: "USAID Nigeria", logo: "https://unavatar.io/clearbit/usaid.gov" },
  { name: "Bill & Melinda Gates Foundation", logo: "https://unavatar.io/clearbit/gatesfoundation.org" },
  { name: "UN OCHA", logo: "https://unavatar.io/clearbit/unocha.org" },
  { name: "Save the Children", logo: "https://unavatar.io/clearbit/savethechildren.org" },
  { name: "Dangote Group", logo: "https://unavatar.io/clearbit/dangote.com" }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
              Coordinating Impact for a <span className="text-emerald-600">Stronger Nigeria</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Whitespace was founded on a simple premise: humanitarian aid is most effective when it is coordinated. 
              We provide the data infrastructure that allows civil society to map their work, identify gaps, and collaborate at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8">
                <Target className="text-emerald-600 w-7 h-7" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                To eliminate service duplication and resource waste in the Nigerian humanitarian sector through real-time data intelligence and institutional coordination.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 p-12 rounded-[3rem] text-white"
            >
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                <Globe className="text-emerald-400 w-7 h-7" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                A Nigeria where every naira of aid reaches its intended destination, guided by precision intelligence and a unified civil society.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Team */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">The Strategic Team</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Meet the experts behind the intelligence platform driving coordination across Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="aspect-square relative rounded-[2.5rem] overflow-hidden mb-8 grayscale hover:grayscale-0 transition-all duration-500">
                  <Image 
                    src={member.image} 
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">{member.role}</p>
                <p className="text-slate-500 leading-relaxed mb-6">{member.bio}</p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-slate-300 hover:text-slate-900 transition-colors"><Linkedin size={20} /></a>
                  <a href="#" className="text-slate-300 hover:text-slate-900 transition-colors"><Twitter size={20} /></a>
                  <a href="#" className="text-slate-300 hover:text-slate-900 transition-colors"><Mail size={20} /></a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Institutional Partners</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We work alongside national and international bodies to ensure data integrity and strategic alignment.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {partners.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-center transition-all group"
              >
                <PartnerLogo 
                  name={partner.name} 
                  logo={partner.logo} 
                  className="w-full aspect-[2/1] group-hover:scale-110 transition-transform" 
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
