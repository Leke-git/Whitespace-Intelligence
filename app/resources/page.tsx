'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Search, Filter, BookOpen, Database, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const RESOURCES = [
  {
    id: 1,
    title: "National NGO Coordination Framework 2026",
    type: "PDF Document",
    category: "Policy",
    size: "2.4 MB",
    date: "2026-03-15",
    icon: FileText
  },
  {
    id: 2,
    title: "LGA Gap Score Dataset (CSV)",
    type: "Data Export",
    category: "Data",
    size: "1.8 MB",
    date: "2026-02-28",
    icon: Database
  },
  {
    id: 3,
    title: "NGO Best Practices Handbook",
    type: "Guide",
    category: "Capacity",
    size: "5.1 MB",
    date: "2026-01-10",
    icon: BookOpen
  },
  {
    id: 4,
    title: "Humanitarian Response Plan (Northeast)",
    type: "PDF Document",
    category: "Strategy",
    size: "3.2 MB",
    date: "2025-12-20",
    icon: FileText
  },
  {
    id: 5,
    title: "WASH Sector Coordination Guidelines",
    type: "PDF Document",
    category: "Policy",
    size: "1.5 MB",
    date: "2025-11-05",
    icon: FileText
  },
  {
    id: 6,
    title: "Quarterly Gap Analysis Report Q4 2025",
    type: "Intelligence",
    category: "Data",
    size: "4.2 MB",
    date: "2026-01-20",
    icon: Database
  },
  {
    id: 7,
    title: "Institutional Capacity Assessment Tool",
    type: "Toolkit",
    category: "Capacity",
    size: "0.8 MB",
    date: "2025-10-15",
    icon: BookOpen
  },
  {
    id: 8,
    title: "Emergency Response Strategy 2026-2028",
    type: "Strategy",
    category: "Strategy",
    size: "6.4 MB",
    date: "2026-02-15",
    icon: FileText
  },
  {
    id: 9,
    title: "Nutrition Sector Monitoring Framework",
    type: "PDF Document",
    category: "Policy",
    size: "2.1 MB",
    date: "2025-09-30",
    icon: FileText
  },
  {
    id: 10,
    title: "Population Displacement Dataset (LGA Level)",
    type: "Data Export",
    category: "Data",
    size: "3.5 MB",
    date: "2026-03-01",
    icon: Database
  }
];

const CATEGORIES = ['Policy', 'Data', 'Capacity', 'Strategy'];
const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
  { label: 'This Year', value: 'year' }
];
const ITEMS_PER_PAGE = 4;

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredResources = useMemo(() => {
    return RESOURCES.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(r.category);
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const resourceDate = new Date(r.date);
        const now = new Date();
        if (dateFilter === '30') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = resourceDate >= thirtyDaysAgo;
        } else if (dateFilter === '90') {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(now.getDate() - 90);
          matchesDate = resourceDate >= ninetyDaysAgo;
        } else if (dateFilter === 'year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          matchesDate = resourceDate >= startOfYear;
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [search, selectedCategories, dateFilter]);

  const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
  
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResources.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredResources, currentPage]);

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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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

            {paginatedResources.length > 0 ? (
              <>
                <div className="flex flex-col gap-6">
                  {paginatedResources.map((resource, idx) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col sm:flex-row items-center justify-between gap-8 group hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500"
                    >
                      <div className="flex items-center gap-6 w-full sm:w-auto min-w-0">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                          <resource.icon className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">{resource.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-emerald-600 group-hover:bg-emerald-100 transition-colors">{resource.category}</span>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span>{resource.type}</span>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span>{resource.size}</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto flex items-center justify-center gap-3 py-4 px-8 bg-slate-50 rounded-2xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-black text-xs uppercase tracking-widest shrink-0">
                        <span>Download</span>
                        <Download size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-3 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                            currentPage === page
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
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
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map(category => {
                        const isSelected = selectedCategories.includes(category);
                        return (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategories(prev =>
                                prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                              );
                              setCurrentPage(1);
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-xs font-bold">{category}</span>
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Published</label>
                    <div className="grid grid-cols-2 gap-3">
                      {DATE_FILTERS.map(filter => {
                        const isSelected = dateFilter === filter.value;
                        return (
                          <button
                            key={filter.value}
                            onClick={() => {
                              setDateFilter(filter.value);
                              setCurrentPage(1);
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-xs font-bold">{filter.label}</span>
                            {isSelected && <Check className="w-3 h-3" />}
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
