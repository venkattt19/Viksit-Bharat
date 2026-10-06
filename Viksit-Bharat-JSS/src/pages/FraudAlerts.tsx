import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FraudAlert } from '../types';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

export function FraudAlerts() {
  const { officer } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'investigating' | 'resolved'>('new');

  useEffect(() => {
    if (officer) {
      loadAlerts();
    }
  }, [officer, filter]);

  const loadAlerts = async () => {
    if (!officer) return;

    try {
      let query = supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    return <Shield className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Fraud Detection Alerts</h1>
        <p className="text-slate-600 mt-1">AI-powered fraud detection and monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
          const count = alerts.filter(a => a.severity === severity).length;
          return (
            <div key={severity} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 capitalize">{severity}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">{count}</p>
                </div>
                <div className={`${getSeverityColor(severity).replace('text-', 'bg-').replace('100', '50')} p-3 rounded-lg`}>
                  {getSeverityIcon(severity)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'new', 'investigating', 'resolved'] as const).map((status) => (
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
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-500">No {filter !== 'all' ? filter : ''} fraud alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <h3 className="font-semibold text-slate-800">{alert.alert_type.replace('_', ' ').toUpperCase()}</h3>
                    <p className="text-sm text-slate-500">{alert.entity_type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
              </div>

              <p className="text-sm text-slate-700 mb-4">{alert.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-slate-500">AI Confidence:</span>
                  <span className="ml-2 font-medium text-slate-700">{alert.ai_confidence}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className="ml-2 font-medium text-slate-700 capitalize">{alert.status}</span>
                </div>
              </div>

              {alert.resolution_notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-1">Resolution Notes:</p>
                  <p className="text-sm text-slate-600">{alert.resolution_notes}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500">
                Detected: {new Date(alert.created_at).toLocaleString()}
                {alert.resolved_at && (
                  <> | Resolved: {new Date(alert.resolved_at).toLocaleString()}</>
                )}
              </div>

              {alert.status === 'new' && (
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
                    Investigate
                  </button>
                  <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                    Mark as False Positive
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
