import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { Plus, Search } from 'lucide-react';
import { NewProjectForm } from '../components/NewProjectForm';

export function Projects() {
  const { officer } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  useEffect(() => {
    if (officer) {
      loadProjects();
    }
  }, [officer]);

  const loadProjects = async () => {
    if (!officer) return;

    try {
      let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

      const jurisdiction = officer.jurisdiction;
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
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-700',
      active: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-slate-100 text-slate-700',
      suspended: 'bg-red-100 text-red-700',
      pending_block_approval: 'bg-amber-100 text-amber-700',
      pending_district_approval: 'bg-orange-100 text-orange-700',
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Project Management</h1>
          <p className="text-slate-600 mt-1">Create and track rural development projects</p>
          {officer && (
            <p className="text-xs text-slate-500 mt-1">Role: {officer.role}</p>
          )}
        </div>
        <div className="flex gap-3">
          {officer?.role === 'village_officer' && (
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No projects found
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-slate-800">{project.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{project.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Code:</span>
                  <span className="font-medium text-slate-700">{project.project_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium text-slate-700">{project.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget:</span>
                  <span className="font-medium text-slate-700">₹{project.budget.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewProjectForm && (
        <NewProjectForm
          onClose={() => setShowNewProjectForm(false)}
          onSuccess={loadProjects}
        />
      )}
    </div>
  );
}
