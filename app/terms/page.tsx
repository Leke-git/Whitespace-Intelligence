'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using Whitespace, you agree to be bound by these Terms of Use and all applicable laws and regulations in Nigeria.",
      icon: CheckCircle
    },
    {
      title: "User Responsibilities",
      content: "You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You must provide accurate and complete information during registration.",
      icon: Info
    },
    {
      title: "Prohibited Conduct",
      content: "You may not use Whitespace for any illegal or unauthorized purpose. You may not attempt to hack, disrupt, or interfere with the platform's functionality or data integrity.",
      icon: AlertCircle
    },
    {
      title: "Intellectual Property",
      content: "All content on Whitespace, including text, graphics, logos, and software, is the property of Whitespace or its content suppliers and is protected by intellectual property laws.",
      icon: FileText
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Terms of Use</h1>
            <p className="text-lg text-slate-600">
              The rules and regulations for using the Whitespace NGO Registry platform.
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
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {section.content}
                </p>
              </motion.section>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Need clarification?</h3>
            <p className="text-slate-400 mb-8 opacity-90">
              Our legal team is available to answer any questions you may have about our terms.
            </p>
            <a href="mailto:legal@whitespace.org" className="inline-block bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all">
              Contact Legal Team
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
