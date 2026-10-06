import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Camera, Upload } from 'lucide-react';

interface WorkerRegistrationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkerRegistrationForm({ onClose, onSuccess }: WorkerRegistrationFormProps) {
  const { officer } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facePhoto, setFacePhoto] = useState<string>('');
  const [captureMethod, setCaptureMethod] = useState<'camera' | 'upload'>('camera');

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    aadhaar_number: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please upload a photo instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setFacePhoto(imageData);
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFacePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFaceImage = async (dataUrl: string): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `worker-face-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('worker-photos')
      .upload(fileName, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('worker-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!officer) {
      alert('Officer information not found');
      return;
    }

    if (!facePhoto) {
      alert('Please capture or upload worker face photo');
      return;
    }

    if (formData.aadhaar_number.length !== 12) {
      alert('Aadhaar number must be 12 digits');
      return;
    }

    setLoading(true);

    try {
      const faceImageUrl = await uploadFaceImage(facePhoto);

      const workerCode = `WRK-${officer.jurisdiction.village?.substring(0, 3).toUpperCase()}-${Date.now()}`;

      const { error } = await supabase.from('workers').insert({
        worker_code: workerCode,
        name: formData.name,
        father_name: formData.father_name,
        aadhaar_number: formData.aadhaar_number,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        village: officer.jurisdiction.village,
        block: officer.jurisdiction.block,
        district: officer.jurisdiction.district,
        face_image_url: faceImageUrl,
        registration_photo_url: faceImageUrl,
        registered_by: officer.id,
        address: {},
      });

      if (error) throw error;

      alert('Worker registered successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error registering worker:', error);
      if (error.code === '23505') {
        alert('A worker with this Aadhaar number is already registered');
      } else {
        alert('Failed to register worker. Please try again.');
      }
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Register New Worker</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Worker Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Father's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                required
                maxLength={12}
                pattern="[0-9]{12}"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12-digit Aadhaar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                maxLength={10}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Worker Face Photo <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setCaptureMethod('camera')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    captureMethod === 'camera'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4 inline mr-2" />
                  Capture from Camera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCaptureMethod('upload');
                    stopCamera();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    captureMethod === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Photo
                </button>
              </div>

              {captureMethod === 'camera' && !facePhoto && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-slate-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={!!stream}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Start Camera
                    </button>
                    <button
                      type="button"
                      onClick={captureFace}
                      disabled={!stream}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Capture Photo
                    </button>
                  </div>
                </div>
              )}

              {captureMethod === 'upload' && !facePhoto && (
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition-colors text-slate-600"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    Click to upload photo
                  </button>
                </div>
              )}

              {facePhoto && (
                <div className="relative">
                  <img
                    src={facePhoto}
                    alt="Worker face"
                    className="w-full rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFacePhoto('')}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !facePhoto}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
