export type MapMode = 'priority' | 'capacity';

export const PRIORITY_THRESHOLDS = [
  { limit: 0.2,  color: '#22c55e', label: 'Stable (Low Need)', bg: 'bg-green-500' },
  { limit: 0.4,  color: '#eab308', label: 'Monitoring (Mid Need)', bg: 'bg-yellow-500' },
  { limit: 0.6,  color: '#f97316', label: 'Attention (High Need)', bg: 'bg-orange-500' },
  { limit: 0.8,  color: '#ef4444', label: 'Critical (Underfunded)', bg: 'bg-red-500' },
  { limit: 1.1,  color: '#7f1d1d', label: 'Emergency (Neglected)', bg: 'bg-red-900' },
];

export const CAPACITY_THRESHOLDS = [
  { limit: 2,   color: '#f1f5f9', label: 'Sparse (0-2)', bg: 'bg-slate-100' },
  { limit: 5,   color: '#dbeafe', label: 'Low (3-5)', bg: 'bg-blue-100' },
  { limit: 10,  color: '#60a5fa', label: 'Moderate (6-10)', bg: 'bg-blue-400' },
  { limit: 20,  color: '#2563eb', label: 'High (11-20)', bg: 'bg-blue-600' },
  { limit: 1000, color: '#1e3a8a', label: 'Dense (20+)', bg: 'bg-blue-900' },
];

export const TRUST_COLOURS: Record<string, string> = {
  'registered': '#94a3b8', // Slate 400
  'verified':   '#10b981', // Emerald 500
  'active':     '#3b82f6', // Blue 500
  'accredited': '#8b5cf6', // Violet 500
};

/**
 * Priority Score Logic:
 * Combines Gap (Need) and Funding (Resources).
 * High Gap + Low Funding = High Priority (Red).
 */
export function getPriorityColor(gap: number, funding: number) {
  // Normalize funding: $1M is "fully funded" for priority calculation
  const normalizedFunding = Math.min(funding / 1000000, 1);
  // Priority increases with gap, decreases with funding
  const priorityScore = gap * (1 - (normalizedFunding * 0.8)); // Funding can reduce priority by up to 80%
  
  return PRIORITY_THRESHOLDS.find(t => priorityScore < t.limit)?.color || '#7f1d1d';
}

export function getCapacityColor(count: number) {
  return CAPACITY_THRESHOLDS.find(t => count < t.limit)?.color || '#1e3a8a';
}
