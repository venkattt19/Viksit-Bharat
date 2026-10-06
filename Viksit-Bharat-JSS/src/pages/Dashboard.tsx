import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Briefcase, ClipboardCheck, Wallet, AlertTriangle, TrendingUp, Brain } from 'lucide-react';
import AIInsights from '../components/AIInsights';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalWorkers: number;
  activeProjects: number;
  todayAttendance: number;
  pendingApprovals: number;
  totalWages: number;
  fraudAlerts: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  village?: string;
  block?: string;
  district?: string;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  key_topics?: string[];
  risk_flags?: string[];
  ai_summary?: string;
  last_analyzed_at?: string;
}

export function Dashboard() {
  const { officer } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalWorkers: 0,
    activeProjects: 0,
    todayAttendance: 0,
    pendingApprovals: 0,
    totalWages: 0,
    fraudAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    if (officer) {
      loadStats();
      loadProjects();
    }
  }, [officer]);

  const loadStats = async () => {
    if (!officer) return;

    try {
      const jurisdiction = officer.jurisdiction;
      const today = new Date().toISOString().split('T')[0];

      let workersQuery = supabase.from('workers').select('id', { count: 'exact', head: true });
      let projectsQuery = supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active');

      if (officer.role === 'village_officer' && jurisdiction.village) {
        workersQuery = workersQuery.eq('village', jurisdiction.village);
        projectsQuery = projectsQuery.eq('village', jurisdiction.village);
      } else if (officer.role === 'block_officer' && jurisdiction.block) {
        workersQuery = workersQuery.eq('block', jurisdiction.block);
        projectsQuery = projectsQuery.eq('block', jurisdiction.block);
      } else if (officer.role === 'district_officer' && jurisdiction.district) {
        workersQuery = workersQuery.eq('district', jurisdiction.district);
        projectsQuery = projectsQuery.eq('district', jurisdiction.district);
      }

      const [workersRes, projectsRes, attendanceRes, approvalsRes, wagesRes, alertsRes] = await Promise.all([
        workersQuery,
        projectsQuery,
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('attendance_date', today),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('approver_id', officer.id),
        supabase.from('wages').select('net_amount').eq('status', 'paid'),
        supabase.from('fraud_alerts').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);

      const totalWages = wagesRes.data?.reduce((sum, wage) => sum + Number(wage.net_amount), 0) || 0;

      setStats({
        totalWorkers: workersRes.count || 0,
        activeProjects: projectsRes.count || 0,
        todayAttendance: attendanceRes.count || 0,
        pendingApprovals: approvalsRes.count || 0,
        totalWages: totalWages,
        fraudAlerts: alertsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!officer) return;

    try {
      const jurisdiction = officer.jurisdiction;
      let query = supabase.from('projects').select('*');

      if (officer.role === 'village_officer' && jurisdiction.village) {
        query = query.eq('village', jurisdiction.village);
      } else if (officer.role === 'block_officer' && jurisdiction.block) {
        query = query.eq('block', jurisdiction.block);
      } else if (officer.role === 'district_officer' && jurisdiction.district) {
        query = query.eq('district', jurisdiction.district);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleAnalyzeProject = async (projectId: string, text: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/databricks-ai-analysis`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, project_id: projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze project');
      }

      await loadProjects();
    } catch (error) {
      console.error('Error analyzing project:', error);
      alert('Failed to analyze project. Please try again.');
    }
  };

  const statCards = [
    {
      title: 'Total Workers',
      value: stats.totalWorkers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Briefcase,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Today\'s Attendance',
      value: stats.todayAttendance,
      icon: ClipboardCheck,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Wages Paid',
      value: `₹${stats.totalWages.toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Fraud Alerts',
      value: stats.fraudAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {officer?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {officer?.role === 'village_officer' && (
              <>
                <button className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  <p className="font-medium text-emerald-700">Register New Worker</p>
                  <p className="text-sm text-emerald-600">Add a new worker with face recognition</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <p className="font-medium text-blue-700">Mark Attendance</p>
                  <p className="text-sm text-blue-600">Record worker attendance for today</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                  <p className="font-medium text-amber-700">Submit Work Progress</p>
                  <p className="text-sm text-amber-600">Upload work progress with photos</p>
                </button>
              </>
            )}
            {officer?.role === 'block_officer' && (
              <>
                <button 
                  onClick={() => navigate('/approvals')}
                  className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-amber-700">Review Project Requests</p>
                  <p className="text-sm text-amber-600">Verify details, location, and photos for new projects</p>
                </button>
                <button 
                  onClick={() => navigate('/approvals')}
                  className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-emerald-700">Review Work Progress</p>
                  <p className="text-sm text-emerald-600">Verify execution reports and site photos</p>
                </button>
              </>
            )}
            {officer?.role === 'district_officer' && (
              <>
                <button 
                  onClick={() => navigate('/wages')}
                  className="w-full text-left px-4 py-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-teal-700">Set District Wage Rates</p>
                  <p className="text-sm text-teal-600">Configure daily wage amounts for workers</p>
                </button>
                <button 
                  onClick={() => navigate('/approvals')}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-blue-700">Final Approvals</p>
                  <p className="text-sm text-blue-600">Approve projects and worker payments</p>
                </button>
              </>
            )}
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-700" />
                <div>
                  <p className="font-medium text-purple-700">AI Project Insights</p>
                  <p className="text-sm text-purple-600">Analyze projects with Databricks AI</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              System monitoring active
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Real-time updates enabled
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              AI fraud detection running
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Databricks AI integration ready
            </p>
          </div>
        </div>
      </div>

      {showAIInsights && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">AI-Powered Project Insights</h2>
            <button
              onClick={() => setShowAIInsights(false)}
              className="text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <AIInsights projects={projects} onAnalyzeProject={handleAnalyzeProject} />
        </div>
      )}
    </div>
  );
}
