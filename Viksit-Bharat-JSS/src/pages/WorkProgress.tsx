import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { WorkProgress as WorkProgressType, Project } from '../types';
import { Plus, Image, MapPin } from 'lucide-react';
import { WorkProgressUpload } from '../components/WorkProgressUpload';

export function WorkProgress() {
  const { officer } = useAuth();
  const [progressRecords, setProgressRecords] = useState<WorkProgressType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (officer) {
      loadData();
    }
  }, [officer]);

  const loadData = async () => {
    if (!officer) return;

    try {
      const [progressRes, projectsRes] = await Promise.all([
        supabase
          .from('work_progress')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('projects').select('*'),
      ]);

      setProgressRecords(progressRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (officer?.role === 'block_officer') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Work Progress</h1>
          <p className="text-slate-600 mt-1">Submit and track work progress with geotagged images</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Submit Progress
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : progressRecords.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
            No work progress records found
          </div>
        ) : (
          progressRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">{getProjectName(record.project_id)}</h3>
                  <p className="text-sm text-slate-500">
                    {new Date(record.submission_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4">{record.work_description}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Workers Count:</span>
                  <span className="font-medium text-slate-700">{record.workers_count}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Image className="w-4 h-4" />
                  <span>{record.images.length} photos attached</span>
                </div>
                {record.location.latitude && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{record.location.latitude.toFixed(6)}, {record.location.longitude?.toFixed(6)}</span>
                  </div>
                )}
              </div>

              {record.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {record.images.slice(0, 3).map((img, idx) => (
                    <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                      <img src={img.url} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showUploadModal && (
        <WorkProgressUpload
          projects={projects}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
