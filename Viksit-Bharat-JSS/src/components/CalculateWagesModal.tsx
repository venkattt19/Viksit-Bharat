import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Calculator } from 'lucide-react';
import { Project } from '../types';

interface CalculateWagesModalProps {
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
}

export function CalculateWagesModal({ onClose, onSuccess, projects }: CalculateWagesModalProps) {
  const { officer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyWage, setDailyWage] = useState<number>(350); // Default fallback
  const [formData, setFormData] = useState({
    project_id: '',
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    if (officer?.jurisdiction?.district) {
      fetchWageConfig(officer.jurisdiction.district);
    }
  }, [officer]);

  const fetchWageConfig = async (district: string) => {
    const { data } = await supabase
      .from('wage_config')
      .select('daily_wage')
      .eq('district', district)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (data) setDailyWage(data.daily_wage);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officer) return;

    setLoading(true);
    try {
      // Fetch verified attendance mapping to 1 day each
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('worker_id')
        .eq('project_id', formData.project_id)
        .eq('is_verified', true)
        .gte('attendance_date', formData.period_start)
        .lte('attendance_date', formData.period_end);

      if (attendanceError) throw attendanceError;

      if (!attendanceData || attendanceData.length === 0) {
        alert('No verified attendance records found for this period.');
        setLoading(false);
        return;
      }

      // Group by worker_id to sum up total attendance days
      const workerDays: Record<string, number> = {};
      attendanceData.forEach((record) => {
        workerDays[record.worker_id] = (workerDays[record.worker_id] || 0) + 1;
      });

      // Generate records to insert
      const wageRecords = Object.entries(workerDays).map(([workerId, days]) => {
        const totalAmount = days * dailyWage;
        return {
          worker_id: workerId,
          project_id: formData.project_id,
          period_start: formData.period_start,
          period_end: formData.period_end,
          days_worked: days,
          daily_rate: dailyWage,
          total_amount: totalAmount,
          net_amount: totalAmount,
          status: 'calculated',
          calculated_by: officer.id,
        };
      });

      const { error: insertError } = await supabase.from('wages').insert(wageRecords);
      if (insertError) throw insertError;

      alert(`Successfully calculated wages for ${wageRecords.length} workers.`);
      onSuccess();
    } catch (error) {
      console.error('Error calculating wages:', error);
      alert('Failed to calculate wages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Calculate Wages</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm border border-emerald-200">
            <strong>Current Set Rate:</strong> ₹{dailyWage} per verified workday
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Project <span className="text-red-500">*</span></label>
            <select name="project_id" required value={formData.project_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="">-- Choose Project --</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Start Date <span className="text-red-500">*</span></label><input type="date" name="period_start" required value={formData.period_start} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">End Date <span className="text-red-500">*</span></label><input type="date" name="period_end" required value={formData.period_end} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"><Calculator className="w-4 h-4" />{loading ? 'Processing...' : 'Calculate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}