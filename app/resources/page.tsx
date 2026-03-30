'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Search, Filter, BookOpen, Database, X, Check } from 'lucide-react';

const RESOURCES = [
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

const CATEGORIES = ['Policy', 'Data', 'Capacity', 'Strategy'];

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredResources = useMemo(() => {
    return RESOURCES.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(r.category);
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategories]);

  return (
    <main className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-grow relative min-h-0 overflow-hidden">
        {/* ── Floating Command Bar (Top) ────────────────────────────────────── */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[1000] flex gap-2">
          <div className="flex-grow relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-sm font-medium"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className={`px-4 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 hover:bg-slate-50 transition-all flex items-center gap-2 ${selectedCategories.length > 0 ? 'text-emerald-600' : 'text-slate-600'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filters</span>
            {selectedCategories.length > 0 && (
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        <div className="h-full overflow-y-auto pt-24 pb-20 custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mb-12">
              <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Resource Library</h1>
              <p className="text-lg text-slate-600 font-medium">
                Access reports, datasets, and policy documents to support your humanitarian work.
              </p>
            </div>

            {filteredResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResources.map((resource, idx) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-emerald-200 hover:shadow-2xl transition-all"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                        <resource.icon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1 truncate leading-tight">{resource.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-emerald-600">{resource.category}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{resource.type}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{resource.size}</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 sm:p-3 bg-slate-50 rounded-xl text-slate-600 sm:text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-bold text-xs sm:text-base">
                      <span className="sm:hidden uppercase tracking-widest">Download</span>
                      <Download size={20} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="text-slate-400 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No resources found</h3>
                <p className="text-slate-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
              </div>
            )}
          </div>
          <Footer />
        </div>

        {/* ── Filter Overlay ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 pb-4 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Filter Resources</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categories</label>
                    <div className="grid grid-cols-1 gap-3">
                      {CATEGORIES.map(category => {
                        const isSelected = selectedCategories.includes(category);
                        return (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategories(prev =>
                                prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                              );
                            }}
                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-sm font-bold">{category}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
