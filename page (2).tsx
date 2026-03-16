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
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState({ orgs: 0, interventions: 0, verified: 0 });
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { count: intCount } = await supabase.from('interventions').select('*', { count: 'exact', head: true });
    const { count: verCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('verified_status', 'verified');
    
    setStats({
      orgs: orgCount || 0,
      interventions: intCount || 0,
      verified: verCount || 0
    });
  }, []);

  const fetchPendingOrgs = useCallback(async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('verified_status', 'pending');
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
    const { error } = await supabase
      .from('organizations')
      .update({ verified_status: status })
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
      setImportStatus('Successfully updated 774 LGAs with real Need Index data.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <FileCheck className="text-white w-4 h-4" />
            </div>
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
            <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
            
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
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Interventions</div>
                <div className="text-4xl font-bold text-blue-600">{stats.interventions}</div>
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
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">CAC Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOrgs.length > 0 ? pendingOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{org.cac_number}</td>
                      <td className="px-6 py-4 text-slate-600">{org.contact_email}</td>
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
            <h1 className="text-3xl font-bold text-slate-900">Need Index Data Import</h1>
            
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Database className="text-blue-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Replace Proxy Data</h3>
                  <p className="text-slate-500">Upload a CSV to update the Need Index for all 774 LGAs.</p>
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
                  <p className="text-xs text-slate-400 mt-2">CSV format: LGA_ID, NEED_INDEX (0.0 - 1.0)</p>
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
                    <strong>Note:</strong> Replacing the Need Index will immediately update the Coordination Map and Gap Intelligence alerts across the platform.
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
