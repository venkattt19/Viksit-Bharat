import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Approval, Project } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProjectApprovalCard } from '../components/ProjectApprovalCard';

export function Approvals() {
  const { officer } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (officer) {
      loadApprovals();
    }
  }, [officer, filter]);

  const loadApprovals = async () => {
    if (!officer) return;

    try {
      let query = supabase
        .from('approvals')
        .select('*')
        .eq('approver_id', officer.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected', comments: string) => {
    try {
      const { error } = await supabase
        .from('approvals')
        .update({
          status,
          comments,
          approved_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (error) throw error;
      loadApprovals();
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Approvals</h1>
        <p className="text-slate-600 mt-1">Multi-level approval workflow management</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
            No {filter !== 'all' ? filter : ''} approvals found
          </div>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(approval.status)}
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {approval.entity_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-slate-500">Level {approval.level} Approval</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(approval.status)}`}>
                  {approval.status}
                </span>
              </div>

              {approval.comments && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">{approval.comments}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500">
                Created: {new Date(approval.created_at).toLocaleString()}
                {approval.approved_at && (
                  <> | Processed: {new Date(approval.approved_at).toLocaleString()}</>
                )}
              </div>

              {approval.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const comments = prompt('Add approval comments (optional):');
                      if (comments !== null) {
                        handleApproval(approval.id, 'approved', comments);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const comments = prompt('Add rejection reason:');
                      if (comments) {
                        handleApproval(approval.id, 'rejected', comments);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
