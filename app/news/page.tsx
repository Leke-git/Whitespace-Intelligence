'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewsPage() {
  const newsItems = [
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

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">News & Updates</h1>
            <p className="text-lg text-slate-600">
              The latest stories, reports, and platform updates from the Whitespace ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((item, idx) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
                    <Calendar size={14} />
                    {item.date}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    {item.excerpt}
                  </p>
                  <Link href={`/news/${item.id}`} className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm hover:gap-3 transition-all">
                    Read Full Story <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
