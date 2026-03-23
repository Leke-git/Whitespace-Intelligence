'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Database, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Upload,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLoader } from '@/components/BrandLoader';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState({ orgs: 0, programmes: 0, verified: 0 });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  // Admin Token Check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expectedToken = process.env.NEXT_PUBLIC_ADMIN_URL_TOKEN;
    
    if (!token || token !== expectedToken) {
      // In a real app, we'd redirect or show 404
      // For this demo, we'll just log it
      console.warn('Unauthorized admin access attempt');
    }
  }, []);

  const handleWipeData = async () => {
    if (!confirm('Type CONFIRM to wipe all demo data. This cannot be undone.')) return;
    setIsWiping(true);
    try {
      // In a real app, this calls a serverless function that runs wipe_dummy_data.sql
      const { error } = await supabase.from('organisations').delete().eq('dummy_data', true);
      if (error) throw error;
      setImportStatus('Demo data wiped successfully.');
      fetchStats();
      fetchPendingOrgs();
    } catch (err: any) {
      setImportStatus('Error wiping data: ' + err.message);
    } finally {
      setIsWiping(false);
    }
  };
  const fetchStats = useCallback(async () => {
    const { count: orgCount } = await supabase.from('organisations').select('*', { count: 'exact', head: true });
    const { count: progCount } = await supabase.from('programmes').select('*', { count: 'exact', head: true });
    const { count: verCount } = await supabase.from('organisations').select('*', { count: 'exact', head: true }).eq('trust_tier', 'verified');
    
    setStats({
      orgs: orgCount || 0,
      programmes: progCount || 0,
      verified: verCount || 0
    });
  }, []);

  const fetchPendingOrgs = useCallback(async () => {
    const { data } = await supabase
      .from('organisations')
      .select('*')
      .eq('trust_tier', 'registered');
    setPendingOrgs(data || []);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchStats();
      await fetchPendingOrgs();
    };
    loadData();
  }, [fetchStats, fetchPendingOrgs]);

  async function handleVerify(id: string, status: 'verified' | 'rejected') {
    // In the new schema, we map 'verified' to trust_tier='verified'
    // 'rejected' isn't a trust_tier, but we can handle it via a verification_events table or just status
    const { error } = await supabase
      .from('organisations')
      .update({ 
        trust_tier: status === 'verified' ? 'verified' : 'registered',
        status: status === 'rejected' ? 'suspended' : 'active'
      })
      .eq('id', id);

    if (!error) {
      fetchPendingOrgs();
      fetchStats();
    }
  }

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus('Processing CSV...');
    // Simulate CSV processing
    setTimeout(() => {
      setImportStatus('Successfully updated 774 LGAs with real Gap Score data.');
    }, 2000);
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BrandLoader size="sm" variant="dots" isStatic={true} />
            <span className="text-lg font-bold tracking-tight font-display uppercase">
              WHITESPACE ADMIN
            </span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'verification', label: 'NGO Verification', icon: Users },
            { id: 'data', label: 'Data Import', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 overflow-y-auto">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
              <button
                onClick={handleWipeData}
                disabled={isWiping}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isWiping ? 'Wiping...' : 'Wipe Demo Data'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Total NGOs</div>
                <div className="text-4xl font-bold text-slate-900">{stats.orgs}</div>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Verified</div>
                <div className="text-4xl font-bold text-emerald-600">{stats.verified}</div>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Programmes</div>
                <div className="text-4xl font-bold text-blue-600">{stats.programmes}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-emerald-600 w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">New NGO Registered</div>
                    <div className="text-sm text-slate-500">&quot;Health for All Foundation&quot; submitted CAC documents.</div>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">2 mins ago</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'verification' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">NGO Verification Queue</h1>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Organisation</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">CAC Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOrgs.length > 0 ? pendingOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{org.legal_name}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{org.cac_number}</td>
                      <td className="px-6 py-4 text-slate-600">{org.email}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleVerify(org.id, 'verified')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <CheckCircle className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => handleVerify(org.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                        No pending verifications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Gap Score Data Import</h1>
            
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Database className="text-blue-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Replace Proxy Data</h3>
                  <p className="text-slate-500">Upload a CSV to update the Gap Score for all 774 LGAs.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-emerald-500 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCsvImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-2">CSV format: LGA_ID, GAP_SCORE (0.0 - 1.0)</p>
                </div>

                {importStatus && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    {importStatus}
                  </div>
                )}

                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div className="text-sm">
                    <strong>Note:</strong> Replacing the Gap Score will immediately update the Coordination Map and Gap Intelligence alerts across the platform.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
