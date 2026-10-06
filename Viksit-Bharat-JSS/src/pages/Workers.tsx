import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Worker } from '../types';
import { UserPlus, Search, Camera, X, Upload, Check } from 'lucide-react';

export function Workers() {
  const { officer } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    aadhaar_number: '',
    date_of_birth: '',
    gender: 'male' as const,
    phone: '',
    address_line1: '',
    address_line2: '',
    village: officer?.jurisdiction?.village || '',
    block: officer?.jurisdiction?.block || '',
    district: officer?.jurisdiction?.district || '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
  });

  useEffect(() => {
    if (officer) {
      loadWorkers();
    }
  }, [officer]);

  const loadWorkers = async () => {
    if (!officer) return;

    try {
      let query = supabase.from('workers').select('*').order('created_at', { ascending: false });

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
      setWorkers(data || []);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officer || !capturedImage) {
      alert('Please capture a face photo before submitting');
      return;
    }

    try {
      setLoading(true);

      const workerCode = `VB-${new Date().getFullYear()}-${String(workers.length + 1).padStart(5, '0')}`;

      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .insert({
          worker_code: workerCode,
          name: formData.name,
          father_name: formData.father_name,
          aadhaar_number: formData.aadhaar_number,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          phone: formData.phone,
          address: {
            line1: formData.address_line1,
            line2: formData.address_line2,
          },
          village: formData.village,
          block: formData.block,
          district: formData.district,
          bank_account: {
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code,
          },
          registered_by: officer.id,
        })
        .select()
        .single();

      if (workerError) throw workerError;

      const fileName = `face_${workerData.id}_${Date.now()}.jpg`;
      const blob = await fetch(capturedImage).then(r => r.blob());

      const { error: uploadError } = await supabase.storage
        .from('worker-faces')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('worker-faces')
        .getPublicUrl(fileName);

      await supabase.from('worker_face_data').insert({
        worker_id: workerData.id,
        face_encoding: capturedImage,
        face_image_url: urlData.publicUrl,
        captured_by: officer.id,
        quality_score: 85,
      });

      alert(`Worker registered successfully!\nWorker ID: ${workerCode}`);
      setShowRegistrationModal(false);
      resetForm();
      loadWorkers();
    } catch (error) {
      console.error('Error registering worker:', error);
      alert('Failed to register worker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      father_name: '',
      aadhaar_number: '',
      date_of_birth: '',
      gender: 'male',
      phone: '',
      address_line1: '',
      address_line2: '',
      village: officer?.jurisdiction?.village || '',
      block: officer?.jurisdiction?.block || '',
      district: officer?.jurisdiction?.district || '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
    });
    setCapturedImage(null);
    stopCamera();
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.worker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (officer?.role === 'block_officer') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Workers Management</h1>
          <p className="text-slate-600 mt-1">Register and manage workers with face recognition</p>
        </div>
        <button
          onClick={() => setShowRegistrationModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Register Worker
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, worker code, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Worker Code</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Father's Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Village</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{worker.worker_code}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{worker.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{worker.father_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{worker.village}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{worker.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        worker.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {worker.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Register New Worker</h2>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Face ID Capture
                </h3>
                <div className="flex flex-col items-center gap-4">
                  {!capturedImage ? (
                    <>
                      {!stream ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Start Camera
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="rounded-lg border-2 border-emerald-300 w-full max-w-md"
                          />
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Check className="w-5 h-5" />
                              Capture Photo
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <img src={capturedImage} alt="Captured" className="rounded-lg border-2 border-emerald-300 max-w-md" />
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                        }}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Retake Photo
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{12}"
                    maxLength={12}
                    placeholder="Enter 12-digit Aadhaar number"
                    value={formData.aadhaar_number}
                    onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Village *</label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Block *</label>
                  <input
                    type="text"
                    required
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!capturedImage || loading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
