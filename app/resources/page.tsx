'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { FileText, Download, Search, Filter, BookOpen, Database } from 'lucide-react';
import { useState } from 'react';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const resources = [
    {
      id: 1,
      title: "National NGO Coordination Framework 2026",
      type: "PDF Document",
      category: "Policy",
      size: "2.4 MB",
      icon: FileText
    },
    {
      id: 2,
      title: "LGA Gap Score Dataset (CSV)",
      type: "Data Export",
      category: "Data",
      size: "1.8 MB",
      icon: Database
    },
    {
      id: 3,
      title: "NGO Best Practices Handbook",
      type: "Guide",
      category: "Capacity",
      size: "5.1 MB",
      icon: BookOpen
    },
    {
      id: 4,
      title: "Humanitarian Response Plan (Northeast)",
      type: "PDF Document",
      category: "Strategy",
      size: "3.2 MB",
      icon: FileText
    }
  ];

  const categories = ['All', 'Policy', 'Data', 'Capacity', 'Strategy'];

  const filteredResources = activeCategory === 'All' 
    ? resources 
    : resources.filter(r => r.category === activeCategory);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold text-slate-900 mb-6">Resource Library</h1>
              <p className="text-lg text-slate-600">
                Access reports, datasets, and policy documents to support your humanitarian work.
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResources.map((resource, idx) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-slate-200 p-8 flex items-center justify-between group hover:border-emerald-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <resource.icon className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{resource.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded uppercase tracking-widest text-[10px]">{resource.category}</span>
                      <span>{resource.type}</span>
                      <span>•</span>
                      <span>{resource.size}</span>
                    </div>
                  </div>
                </div>
                <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                  <Download size={20} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
