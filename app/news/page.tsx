'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ArrowRight, Search, Filter, X, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const NEWS_ITEMS = [
  {
    id: 1,
    title: "Whitespace Intelligence Report: Q1 2026 Humanitarian Gaps",
    excerpt: "Our latest analysis reveals critical service gaps in the Northeast region, particularly in WASH and Protection sectors.",
    date: "March 20, 2026",
    category: "Intelligence",
    image: "https://picsum.photos/seed/news1/800/400"
  },
  {
    id: 2,
    title: "New Partnership with National Bureau of Statistics",
    excerpt: "Whitespace is proud to announce a data-sharing agreement with the NBS to improve the accuracy of our gap score metrics.",
    date: "March 15, 2026",
    category: "Partnership",
    image: "https://picsum.photos/seed/news2/800/400"
  },
  {
    id: 3,
    title: "NGO Verification Process Updated for 2026",
    excerpt: "We've streamlined our CAC verification workflow to reduce onboarding time for new civil society organisations.",
    date: "March 10, 2026",
    category: "Platform",
    image: "https://picsum.photos/seed/news3/800/400"
  }
];

const CATEGORIES = ["Intelligence", "Partnership", "Platform"];

export default function NewsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredNews = useMemo(() => {
    return NEWS_ITEMS.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                           item.excerpt.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
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
              placeholder="Search news & reports..."
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
              <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">News & Updates</h1>
              <p className="text-lg text-slate-600 font-medium">
                The latest stories, reports, and platform updates from the Whitespace ecosystem.
              </p>
            </div>

            {filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((item, idx) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <Image 
                        src={item.image} 
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                        <Calendar size={14} className="text-emerald-500" />
                        {item.date}
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors leading-tight">
                        {item.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                        {item.excerpt}
                      </p>
                      <Link href={`/news/${item.id}`} className="inline-flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-widest hover:gap-5 transition-all">
                        Read Full Story <ArrowRight size={16} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="text-slate-400 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No news found</h3>
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
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Filter News</h3>
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
