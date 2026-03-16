'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, MapPin, Calendar, DollarSign, Users, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SECTORS = ['Health', 'Education', 'Nutrition', 'WASH', 'Protection', 'Food Security', 'Livelihoods', 'Shelter', 'Other'];

export default function NewInterventionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [sector, setSector] = useState('');
  const [lgaId, setLgaId] = useState('');
  const [budget, setBudget] = useState('');
  const [targetReach, setTargetReach] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to log an intervention.');

      const { error: insertError } = await supabase.from('interventions').insert({
        org_id: user.id,
        lga_id: parseInt(lgaId),
        sector,
        budget: parseFloat(budget),
        target_reach: parseInt(targetReach),
        start_date: startDate,
        end_date: endDate,
        description,
        status: 'active'
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push('/map'), 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while logging the intervention.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-form" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-form)" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Plus className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Log New Intervention</h1>
              <p className="text-slate-400">Map your organization&apos;s impact and help eliminate service duplication.</p>
            </div>
          </div>

          <div className="p-10">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="text-emerald-600 w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Intervention Logged!</h2>
                  <p className="text-slate-600 max-w-sm mx-auto">
                    Your activity has been mapped and will be processed by the Gap Intelligence engine.
                  </p>
                  <div className="text-sm text-slate-400">Redirecting to map...</div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sector */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Sector</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                          required
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white"
                        >
                          <option value="">Select Sector</option>
                          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* LGA */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target LGA</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="number"
                          required
                          min="1"
                          max="774"
                          value={lgaId}
                          onChange={(e) => setLgaId(e.target.value)}
                          placeholder="LGA ID (1-774)"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Budget (NGN)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="number"
                          required
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Target Reach */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Reach (People)</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="number"
                          required
                          value={targetReach}
                          onChange={(e) => setTargetReach(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Intervention Description</label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the activities, objectives, and expected outcomes..."
                      className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm">
                      <AlertCircle className="w-5 h-5 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="text-slate-500 font-bold hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {loading ? 'Logging...' : 'Log Intervention'}
                      {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
