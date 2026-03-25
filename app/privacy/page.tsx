'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: "Data Collection",
      content: "We collect information provided by NGOs during registration, including CAC documentation, programme data, and contact information. We also collect anonymized usage data to improve our platform.",
      icon: Eye
    },
    {
      title: "How We Use Data",
      content: "Your data is used to populate the NGO Registry, generate coordination maps, and calculate gap scores. We do not sell your personal or institutional data to third parties.",
      icon: FileText
    },
    {
      title: "Data Security",
      content: "We use industry-standard encryption and security protocols to protect your information. Access to sensitive data is restricted to authorized personnel and verified institutional partners.",
      icon: Lock
    },
    {
      title: "Your Rights",
      content: "You have the right to access, correct, or delete your data at any time through your organisation dashboard. You can also request a full export of your data.",
      icon: Shield
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Data Privacy Policy</h1>
            <p className="text-lg text-slate-600">
              How Whitespace collects, uses, and protects your institutional and personal data.
            </p>
            <div className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated: March 25, 2026</div>
          </div>

          <div className="space-y-12 mb-20">
            {sections.map((section, idx) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {section.content}
                </p>
              </motion.section>
            ))}
          </div>

          <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Questions about your privacy?</h3>
            <p className="text-emerald-50 mb-8 opacity-90">
              Our data protection officer is available to answer any questions you may have.
            </p>
            <a href="mailto:privacy@whitespace.org" className="inline-block bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all">
              Contact Data Protection Officer
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
