'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { 
  Download, 
  ExternalLink, 
  MapPin, 
  Users, 
  Calendar, 
  FileText, 
  Image as ImageIcon,
  ChevronRight,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  Quote,
  ShieldCheck,
  LayoutGrid,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandLoader } from '@/components/BrandLoader';

interface Organisation {
  id: string;
  legal_name: string;
  slug: string;
  description: string;
  mission: string;
  impact_summary: string;
  hero_image_url: string;
  brand_color: string;
  testimonial_quote: string;
  testimonial_author: string;
  logo_url: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  trust_tier: string;
  cac_number: string;
}

interface Programme {
  id: string;
  name: string;
  description: string;
  status: string;
  beneficiary_count: number;
  sector_id: number;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  resource_type: 'report' | 'case_study' | 'financial_statement' | 'policy' | 'other';
  file_size: string;
}

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string;
  project_name: string;
  category: string;
}

export default function OrganisationLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'gallery' | 'resources'>('overview');

  const fetchData = useCallback(async () => {
    // 1. Fetch Organisation
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (orgError || !orgData) {
      console.error('Error fetching organisation:', orgError);
      setLoading(false);
      return;
    }
    setOrg(orgData);

    // 2. Fetch Programmes
    const { data: progData } = await supabase
      .from('programmes')
      .select('*')
      .eq('organisation_id', orgData.id)
      .order('created_at', { ascending: false });
    setProgrammes(progData || []);

    // 3. Fetch Resources
    const { data: resData } = await supabase
      .from('organisation_resources')
      .select('*')
      .eq('organisation_id', orgData.id)
      .order('created_at', { ascending: false });
    setResources(resData || []);

    // 4. Fetch Gallery
    const { data: gallData } = await supabase
      .from('organisation_gallery')
      .select('*')
      .eq('organisation_id', orgData.id)
      .order('created_at', { ascending: false });
    setGallery(gallData || []);

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <BrandLoader size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading organization profile...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Organisation not found</h1>
        <Link href="/registry" className="text-emerald-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </Link>
      </div>
    );
  }

  const brandColor = org.brand_color || '#10b981'; // Default emerald-500

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {org.hero_image_url ? (
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <Image 
              src={org.hero_image_url} 
              alt={org.legal_name} 
              fill 
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-slate-900" style={{ backgroundColor: brandColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-2xl p-4 shadow-2xl relative overflow-hidden flex-shrink-0"
            >
              {org.logo_url ? (
                <Image src={org.logo_url} alt={org.legal_name} fill className="object-contain p-4" referrerPolicy="no-referrer" />
              ) : (
                <Users className="w-full h-full text-slate-200" />
              )}
            </motion.div>
            <div className="flex-grow text-white pb-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-4"
              >
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {org.trust_tier}
                </span>
                <span className="text-white/60 text-sm font-mono uppercase tracking-tighter">CAC: {org.cac_number}</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
              >
                {org.legal_name}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-6 text-white/80"
              >
                {org.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {org.address}</div>}
                {org.website && <a href={org.website} target="_blank" className="flex items-center gap-2 hover:text-white transition-colors"><Globe className="w-4 h-4" /> Website</a>}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-8 py-4 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'projects', label: 'Projects & Work', icon: ImageIcon },
              { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              { id: 'resources', label: 'Reports & Resources', icon: FileDown },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 font-medium text-sm transition-all relative py-2 ${
                  activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute bottom-0 left-0 right-0 h-0.5" 
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 italic serif">Mission & Vision</h2>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    {org.mission || org.description}
                  </p>
                </section>

                {org.impact_summary && (
                  <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 italic serif">Impact Summary</h2>
                    <div className="prose prose-slate max-w-none text-slate-700">
                      {org.impact_summary}
                    </div>
                  </section>
                )}

                {org.testimonial_quote && (
                  <section className="relative py-12 px-8 bg-slate-900 rounded-3xl text-white overflow-hidden">
                    <Quote className="absolute top-8 left-8 w-16 h-16 text-white/10" />
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                      <p className="text-2xl font-medium mb-8 italic leading-relaxed">
                        &quot;{org.testimonial_quote}&quot;
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-0.5 bg-white/20" />
                        <span className="font-bold tracking-widest uppercase text-sm">{org.testimonial_author}</span>
                        <div className="w-12 h-0.5 bg-white/20" />
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    {org.email && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <a href={`mailto:${org.email}`} className="hover:text-emerald-600 transition-colors">{org.email}</a>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.address && (
                      <div className="flex items-start gap-3 text-slate-700">
                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                        <span>{org.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 mb-4">Verification Status</h3>
                  <p className="text-emerald-700 text-sm leading-relaxed mb-4">
                    This organisation has been verified by the platform through rigorous documentation checks.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    {org.trust_tier.toUpperCase()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 italic serif">Active Programmes & Projects</h2>
                <span className="text-slate-500 font-mono">{programmes.length} Total</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {programmes.map((prog, idx) => (
                  <motion.div 
                    key={prog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest">
                        {prog.status}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Users className="w-4 h-4" />
                        {prog.beneficiary_count || 0} Beneficiaries
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{prog.name}</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {prog.description}
                    </p>
                    <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900 hover:gap-4 transition-all">
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                {programmes.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No active programmes listed yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 italic serif">Visual Proof of Work</h2>
                <span className="text-slate-500 font-mono">{gallery.length} Photos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100"
                  >
                    <Image 
                      src={item.image_url} 
                      alt={item.caption || 'Gallery image'} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                      {item.project_name && (
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                          {item.project_name}
                        </span>
                      )}
                      <p className="text-white font-medium line-clamp-2">{item.caption}</p>
                      {item.category && (
                        <span className="mt-4 inline-block text-[10px] text-white/60 uppercase tracking-tighter">
                          Category: {item.category}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {gallery.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="text-slate-300 w-8 h-8" />
                    </div>
                    <p className="text-slate-500">No gallery items uploaded yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div 
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 italic serif">Transparency & Reports</h2>
                <span className="text-slate-500 font-mono">{resources.length} Documents</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((res, idx) => (
                  <motion.div 
                    key={res.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-emerald-200 transition-all flex items-start gap-6 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 transition-colors">
                      <FileText className="w-7 h-7 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {res.resource_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{res.file_size}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{res.title}</h3>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2">{res.description}</p>
                      <a 
                        href={res.url} 
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download Resource
                      </a>
                    </div>
                  </motion.div>
                ))}
                {resources.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileDown className="text-slate-300 w-8 h-8" />
                    </div>
                    <p className="text-slate-500">No reports or resources available for download yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <footer className="bg-slate-900 py-20 mt-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Support our mission</h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Your support helps us continue our work in {org.legal_name}. 
            Join us in making a difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: brandColor, color: '#fff' }}
            >
              Donate Now
            </button>
            <Link 
              href="/registry"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white border border-white/20 hover:bg-white/10 transition-all"
            >
              Back to Registry
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
