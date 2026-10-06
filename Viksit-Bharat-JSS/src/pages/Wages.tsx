import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Wage, Worker, Project } from '../types';
import { Calculator, DollarSign, Settings } from 'lucide-react';
import { CalculateWagesModal } from '../components/CalculateWagesModal';
import { WageConfigModal } from '../components/WageConfigModal';

export function Wages() {
  const { officer } = useAuth();
  const [wages, setWages] = useState<Wage[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showWageConfigModal, setShowWageConfigModal] = useState(false);

  useEffect(() => {
    if (officer) {
      loadData();
    }
  }, [officer]);

  const loadData = async () => {
    if (!officer) return;

    try {
      const [wagesRes, workersRes, projectsRes] = await Promise.all([
        supabase
          .from('wages')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('workers').select('*'),
        supabase.from('projects').select('*'),
      ]);

      setWages(wagesRes.data || []);
      setWorkers(workersRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerName = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      calculated: 'bg-blue-100 text-blue-700',
      approved: 'bg-emerald-100 text-emerald-700',
      paid: 'bg-teal-100 text-teal-700',
    };
    return colors[status as keyof typeof colors] || colors.calculated;
  };

  const totalWages = wages.reduce((sum, wage) => sum + Number(wage.net_amount), 0);
  const paidWages = wages.filter(w => w.status === 'paid').reduce((sum, wage) => sum + Number(wage.net_amount), 0);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Wage Management</h1>
          <p className="text-slate-600 mt-1">Calculate and track worker wages</p>
        </div>
        
        <div className="flex gap-3">
          {officer?.role === 'district_officer' && (
            <button
              onClick={() => setShowWageConfigModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              Set Daily Wage
            </button>
          )}
          <button
            onClick={() => setShowCalculateModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Calculator className="w-5 h-5" />
            Calculate Wages
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Wages</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">₹{totalWages.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Paid Wages</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">₹{paidWages.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Wages</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">₹{(totalWages - paidWages).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Worker</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Project</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Period</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Days</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Rate</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Net Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : wages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No wage records found
                  </td>
                </tr>
              ) : (
                wages.map((wage) => (
                  <tr key={wage.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{getWorkerName(wage.worker_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{getProjectName(wage.project_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(wage.period_start).toLocaleDateString()} - {new Date(wage.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{wage.days_worked}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">₹{wage.daily_rate.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">₹{wage.net_amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wage.status)}`}>
                        {wage.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCalculateModal && (
        <CalculateWagesModal
          onClose={() => setShowCalculateModal(false)}
          onSuccess={() => {
            setShowCalculateModal(false);
            loadData();
          }}
          projects={projects}
        />
      )}

      {showWageConfigModal && (
        <WageConfigModal onClose={() => setShowWageConfigModal(false)} />
      )}
    </div>
  );
}
