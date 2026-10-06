import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { Check, X, AlertTriangle, MapPin, Calendar, DollarSign } from 'lucide-react';

interface ProjectApprovalCardProps {
  project: Project;
  onApprove: () => void;
  onReject: () => void;
  onFlag: () => void;
}

export function ProjectApprovalCard({ project, onApprove, onReject, onFlag }: ProjectApprovalCardProps) {
  const { officer } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!officer) return;

    setLoading(true);
    try {
      const isBlockOfficer = officer.role === 'block_officer';
      const isDistrictOfficer = officer.role === 'district_officer';

      const updates: any = {};

      if (isBlockOfficer) {
        updates.status = 'pending_district_approval';
        updates.approved_by_block_officer = officer.id;
        updates.block_approval_date = new Date().toISOString();
      } else if (isDistrictOfficer) {
        updates.status = 'active';
        updates.approved_by_district_officer = officer.id;
        updates.district_approval_date = new Date().toISOString();
      }

      const { error: projectError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);

      if (projectError) throw projectError;

      const { error: approvalError } = await supabase
        .from('project_approvals')
        .insert({
          project_id: project.id,
          officer_id: officer.id,
          officer_role: officer.role,
          action: 'approved',
          comments,
        });

      if (approvalError) throw approvalError;

      alert(`Project approved successfully and forwarded to ${isBlockOfficer ? 'District Officer' : 'implementation'}`);
      onApprove();
    } catch (error) {
      console.error('Error approving project:', error);
      alert('Failed to approve project');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!officer || !comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          status: 'suspended',
          rejection_reason: comments,
        })
        .eq('id', project.id);

      if (projectError) throw projectError;

      const { error: approvalError } = await supabase
        .from('project_approvals')
        .insert({
          project_id: project.id,
          officer_id: officer.id,
          officer_role: officer.role,
          action: 'rejected',
          comments,
        });

      if (approvalError) throw approvalError;

      alert('Project rejected');
      onReject();
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('Failed to reject project');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!officer || !comments.trim()) {
      alert('Please provide a reason for flagging');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          flagged: true,
          flag_reason: comments,
        })
        .eq('id', project.id);

      if (error) throw error;

      alert('Project flagged for review');
      onFlag();
    } catch (error) {
      console.error('Error flagging project:', error);
      alert('Failed to flag project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{project.name}</h3>
          <p className="text-sm text-slate-500">{project.project_code}</p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          Pending Approval
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
          <span className="text-slate-600">
            {project.village}, {project.block}, {project.district}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
          <span className="text-slate-600">
            {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-slate-400 mt-0.5" />
          <span className="text-slate-600">
            Budget: ₹{project.budget.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-slate-700">Description:</span>
            <p className="text-sm text-slate-600 mt-1">{project.description}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-slate-700">Project Type:</span>
            <p className="text-sm text-slate-600">{project.project_type}</p>
          </div>

          {project.estimated_workers && (
            <div>
              <span className="text-sm font-medium text-slate-700">Estimated Workers:</span>
              <p className="text-sm text-slate-600">{project.estimated_workers}</p>
            </div>
          )}

          {project.work_details && (
            <div>
              <span className="text-sm font-medium text-slate-700">Work Details:</span>
              <p className="text-sm text-slate-600">
                {project.work_details.type} - {project.work_details.quantity}
              </p>
            </div>
          )}

          {project.materials_required && project.materials_required.length > 0 && (
            <div>
              <span className="text-sm font-medium text-slate-700">Materials Required:</span>
              <p className="text-sm text-slate-600">{project.materials_required.join(', ')}</p>
            </div>
          )}

          {project.site_photos && project.site_photos.length > 0 && (
            <div>
              <span className="text-sm font-medium text-slate-700 block mb-2">Site Photos:</span>
              <div className="grid grid-cols-2 gap-2">
                {project.site_photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Site ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {project.location && (project.location.latitude || project.location.longitude) && (
            <div>
              <span className="text-sm font-medium text-slate-700">GPS Location:</span>
              <p className="text-sm text-slate-600">
                {project.location.latitude}, {project.location.longitude}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 mb-4"
      >
        {showDetails ? 'Hide Details' : 'View Details'}
      </button>

      <div className="space-y-3">
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add comments or notes..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Approve
          </button>

          <button
            onClick={handleFlag}
            disabled={loading || !comments.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            Flag
          </button>

          <button
            onClick={handleReject}
            disabled={loading || !comments.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
