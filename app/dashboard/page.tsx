'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Upload,
  Type,
  Palette,
  Quote,
  FileDown,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { BrandLoader } from '@/components/BrandLoader';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'gallery' | 'resources'>('branding');
  
  const [org, setOrg] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Form states for branding
  const [branding, setBranding] = useState({
    impact_summary: '',
    hero_image_url: '',
    brand_color: '#10b981',
    testimonial_quote: '',
    testimonial_author: ''
  });

  // Form states for new items
  const [newGalleryItem, setNewGalleryItem] = useState({ image_url: '', caption: '', project_name: '', category: '' });
  const [newResource, setNewResource] = useState({ title: '', description: '', url: '', resource_type: 'report', file_size: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    // Fetch Org
    const { data: orgData } = await supabase
      .from('organisations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (orgData) {
      setOrg(orgData);
      setBranding({
        impact_summary: orgData.impact_summary || '',
        hero_image_url: orgData.hero_image_url || '',
        brand_color: orgData.brand_color || '#10b981',
        testimonial_quote: orgData.testimonial_quote || '',
        testimonial_author: orgData.testimonial_author || ''
      });

      // Fetch Gallery
      const { data: gallData } = await supabase
        .from('organisation_gallery')
        .select('*')
        .eq('organisation_id', orgData.id)
        .order('created_at', { ascending: false });
      setGallery(gallData || []);

      // Fetch Resources
      const { data: resData } = await supabase
        .from('organisation_resources')
        .select('*')
        .eq('organisation_id', orgData.id)
        .order('created_at', { ascending: false });
      setResources(resData || []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSaveBranding = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('organisations')
        .update(branding)
        .eq('id', org.id);
      
      if (error) throw error;
      setSuccess('Branding updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGalleryItem = async () => {
    if (!newGalleryItem.image_url) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organisation_gallery')
        .insert({ ...newGalleryItem, organisation_id: org.id });
      
      if (error) throw error;
      setNewGalleryItem({ image_url: '', caption: '', project_name: '', category: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    try {
      await supabase.from('organisation_gallery').delete().eq('id', id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddResource = async () => {
    if (!newResource.title || !newResource.url) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organisation_resources')
        .insert({ ...newResource, organisation_id: org.id });
      
      if (error) throw error;
      setNewResource({ title: '', description: '', url: '', resource_type: 'report', file_size: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await supabase.from('organisation_resources').delete().eq('id', id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <BrandLoader size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar />

      <div className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 space-y-2 sticky top-0 self-start">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">NGO Dashboard</h2>
                  <p className="text-xs text-slate-500">Proof of Work Manager</p>
                </div>
              </div>
              <Link 
                href={`/org/${org?.slug}`} 
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                View Public Page <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {[
              { id: 'branding', label: 'Page Branding', icon: Palette },
              { id: 'gallery', label: 'Work Gallery', icon: ImageIcon },
              { id: 'resources', label: 'Resources & Reports', icon: FileDown },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:bg-white hover:text-emerald-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <div className="flex-grow space-y-8">
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3 border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}

            {activeTab === 'branding' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-emerald-500" />
                    Customise Landing Page
                  </h3>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Hero Image URL</label>
                        <input 
                          type="text" 
                          value={branding.hero_image_url}
                          onChange={(e) => setBranding({ ...branding, hero_image_url: e.target.value })}
                          placeholder="https://example.com/hero.jpg"
                          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Brand Primary Colour</label>
                        <div className="flex gap-4">
                          <input 
                            type="color" 
                            value={branding.brand_color}
                            onChange={(e) => setBranding({ ...branding, brand_color: e.target.value })}
                            className="h-12 w-20 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={branding.brand_color}
                            onChange={(e) => setBranding({ ...branding, brand_color: e.target.value })}
                            className="flex-grow p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Impact Summary (Rich Text/Markdown)</label>
                      <textarea 
                        rows={6}
                        value={branding.impact_summary}
                        onChange={(e) => setBranding({ ...branding, impact_summary: e.target.value })}
                        placeholder="Summarise your organisation's key achievements and impact..."
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Featured Testimonial</label>
                        <textarea 
                          rows={3}
                          value={branding.testimonial_quote}
                          onChange={(e) => setBranding({ ...branding, testimonial_quote: e.target.value })}
                          placeholder="A powerful quote from a beneficiary or partner..."
                          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Testimonial Author</label>
                        <input 
                          type="text" 
                          value={branding.testimonial_author}
                          onChange={(e) => setBranding({ ...branding, testimonial_author: e.target.value })}
                          placeholder="e.g. Jane Doe, Community Leader"
                          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleSaveBranding}
                        disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                    Add Gallery Item
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Image URL</label>
                      <input 
                        type="text" 
                        value={newGalleryItem.image_url}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, image_url: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Project Name</label>
                      <input 
                        type="text" 
                        value={newGalleryItem.project_name}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, project_name: e.target.value })}
                        placeholder="e.g. Clean Water Project"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Caption</label>
                    <input 
                      type="text" 
                      value={newGalleryItem.caption}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                      placeholder="Brief description of the photo..."
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddGalleryItem}
                    disabled={saving || !newGalleryItem.image_url}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" /> Add to Gallery
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery.map((item) => (
                    <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <Image src={item.image_url} alt={item.caption} fill className="object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all transform scale-90 group-hover:scale-100"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.project_name || 'General'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-emerald-500" />
                    Add Resource / Report
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Document Title</label>
                      <input 
                        type="text" 
                        value={newResource.title}
                        onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                        placeholder="e.g. Annual Report 2025"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Resource Type</label>
                      <select 
                        value={newResource.resource_type}
                        onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value as any })}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      >
                        <option value="report">Annual/Impact Report</option>
                        <option value="case_study">Case Study</option>
                        <option value="financial_statement">Financial Statement</option>
                        <option value="policy">Policy Document</option>
                        <option value="other">Other Resource</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File URL (PDF/Doc)</label>
                      <input 
                        type="text" 
                        value={newResource.url}
                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                        placeholder="https://example.com/report.pdf"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File Size (optional)</label>
                      <input 
                        type="text" 
                        value={newResource.file_size}
                        onChange={(e) => setNewResource({ ...newResource, file_size: e.target.value })}
                        placeholder="e.g. 2.4 MB"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                    <input 
                      type="text" 
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                      placeholder="Briefly describe what this document contains..."
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddResource}
                    disabled={saving || !newResource.title || !newResource.url}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" /> Add Resource
                  </button>
                </div>

                <div className="space-y-4">
                  {resources.map((res) => (
                    <div key={res.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                          <FileText className="text-slate-400 w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{res.title}</h4>
                          <p className="text-xs text-slate-500">{res.resource_type.replace('_', ' ')} • {res.file_size || 'Unknown size'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  </main>
  );
}
