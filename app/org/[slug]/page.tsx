'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Heart,
  Target,
  Quote
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface Organisation {
  id: string;
  legal_name: string;
  slug: string;
  mission: string;
  description: string;
  impact_summary: string;
  logo_url: string;
  hero_image_url: string;
  brand_color: string;
  testimonial_quote: string;
  testimonial_author: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  trust_tier: string;
}

interface Programme {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function OrganisationLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [org, setOrg] = useState<Organisation | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch Org
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (orgError) {
      console.error('Error fetching organisation:', orgError);
    } else {
      setOrg(orgData);
      
      // Fetch Programmes
      const { data: progData, error: progError } = await supabase
        .from('programmes')
        .select('*')
        .eq('organisation_id', orgData.id)
        .eq('status', 'active');
        
      if (!progError) {
        setProgrammes(progData || []);
      }
    }
    
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    load();
    return () => { isMounted = false; };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Organisation Not Found</h1>
        <p className="text-slate-600 mb-6">The NGO you are looking for does not exist or has been removed.</p>
        <a href="/registry" className="text-emerald-600 font-medium hover:underline">Return to Registry</a>
      </div>
    );
  }

  const brandColor = org.brand_color || '#10b981'; // Default emerald-500

  return (
    <main className="min-h-screen bg-white selection:bg-emerald-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={org.hero_image_url || `https://picsum.photos/seed/${org.slug}/1920/1080`}
            alt={org.legal_name}
            fill
            className="object-cover brightness-[0.4]"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              {org.trust_tier === 'verified' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified NGO
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              {org.legal_name}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed font-light">
              {org.mission || org.description?.substring(0, 160) + '...'}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                style={{ backgroundColor: brandColor }}
                className="px-8 py-4 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-black/20"
              >
                Support Our Mission
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Impact Bar */}
      <div className="relative z-20 -mt-12 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-slate-100">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-2">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Our Focus</span>
            </div>
            <p className="text-xl font-bold text-slate-900">Community Empowerment</p>
          </div>
          <div className="text-center md:text-left md:pl-8">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Impact Goal</span>
            </div>
            <p className="text-xl font-bold text-slate-900">10,000+ Beneficiaries</p>
          </div>
          <div className="text-center md:text-left md:pl-8">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Network</span>
            </div>
            <p className="text-xl font-bold text-slate-900">50+ Local Partners</p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">About the Organisation</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
              Driving sustainable change through local action.
            </h3>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>{org.description}</p>
              {org.impact_summary && (
                <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-emerald-500">
                  <p className="font-medium text-slate-900 italic">&ldquo;{org.impact_summary}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={`https://picsum.photos/seed/${org.slug}-about/800/800`}
              alt="About Us"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      {org.testimonial_quote && (
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <Quote className="w-16 h-16 text-emerald-500 mx-auto mb-12 opacity-50" />
            <blockquote className="text-3xl md:text-4xl font-medium leading-snug mb-10 italic">
              &ldquo;{org.testimonial_quote}&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xl">
                {org.testimonial_author?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-xl">{org.testimonial_author}</p>
                <p className="text-emerald-400 text-sm uppercase tracking-widest font-bold">Beneficiary</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Programmes Section */}
      {programmes.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">Our Programmes</h2>
              <h3 className="text-4xl font-bold text-slate-900">Current Initiatives</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programmes.map((prog) => (
                <div key={prog.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">{prog.name}</h4>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {prog.description}
                  </p>
                  <button className="text-emerald-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Footer */}
      <section className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-8">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Our Office</p>
                    <p className="text-slate-600">{org.address || 'Address information not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Email Us</p>
                    <p className="text-slate-600">{org.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Call Us</p>
                    <p className="text-slate-600">{org.phone || 'Phone number not provided'}</p>
                  </div>
                </div>
                {org.website && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Website</p>
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                        {org.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 p-10 rounded-3xl">
              <h4 className="text-2xl font-bold text-slate-900 mb-6">Stay Updated</h4>
              <p className="text-slate-600 mb-8">Subscribe to our newsletter to receive updates on our impact and upcoming programmes.</p>
              <form className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-6 py-4 rounded-full border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button 
                  type="button"
                  style={{ backgroundColor: brandColor }}
                  className="w-full py-4 rounded-full text-white font-bold shadow-lg shadow-black/5"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <p>© 2026 {org.legal_name}. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
