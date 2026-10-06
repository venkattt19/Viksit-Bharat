import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, DollarSign } from 'lucide-react';

export function WageConfigModal({ onClose }: { onClose: () => void }) {
  const { officer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyWage, setDailyWage] = useState('350');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officer || !officer.jurisdiction.district) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('wage_config').insert({
        district: officer.jurisdiction.district,
        daily_wage: parseFloat(dailyWage),
        effective_from: new Date().toISOString().split('T')[0],
        set_by: officer.id,
      });

      if (error) throw error;
      alert('Daily wage configured successfully!');
      onClose();
    } catch (error) {
      console.error('Error setting wage config:', error);
      alert('Failed to set wage configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Set Daily Wage Rate</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Daily Wage Amount (₹) <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-5 w-5 text-slate-400" /></div>
              <input type="number" required min="1" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 350" />
            </div>
            <p className="text-xs text-slate-500 mt-2">This rate will apply to all new wage calculations in {officer?.jurisdiction?.district || 'your district'}.</p>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Saving...' : 'Save Configuration'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}