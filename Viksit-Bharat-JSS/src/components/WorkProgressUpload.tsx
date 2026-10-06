import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Upload, MapPin, Camera } from 'lucide-react';
import { Project } from '../types';

interface WorkProgressUploadProps {
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkProgressUpload({ projects, onClose, onSuccess }: WorkProgressUploadProps) {
  const { officer } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<Array<{file: File; preview: string}>>([]);
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedProject, setSelectedProject] = useState('');

  const [formData, setFormData] = useState({
    work_description: '',
    workers_count: '',
    quantity_completed: '',
    unit: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get location');
          setGettingLocation(false);
        }
      );
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const uploadPhotos = async (): Promise<Array<{url: string; timestamp: string; location: any}>> => {
    const uploadedPhotos = [];

    for (const photo of photos) {
      const timestamp = new Date().toISOString();
      const fileName = `progress-${selectedProject}-${timestamp}-${photo.file.name}`;

      const { data, error } = await supabase.storage
        .from('work-progress-photos')
        .upload(fileName, photo.file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('work-progress-photos')
        .getPublicUrl(data.path);

      uploadedPhotos.push({
        url: publicUrl,
        timestamp,
        location,
      });
    }

    return uploadedPhotos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!officer) {
      alert('Officer information not found');
      return;
    }

    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    if (photos.length === 0) {
      alert('Please upload at least one photo');
      return;
    }

    if (!location) {
      alert('Please get current location');
      return;
    }

    setLoading(true);

    try {
      const uploadedPhotos = await uploadPhotos();

      const { error } = await supabase.from('work_progress').insert({
        project_id: selectedProject,
        submitted_by: officer.id,
        submission_date: new Date().toISOString().split('T')[0],
        work_description: formData.work_description,
        workers_count: parseInt(formData.workers_count),
        images: uploadedPhotos,
        location,
        measurement: {
          quantity: formData.quantity_completed,
          unit: formData.unit,
        },
        status: 'pending',
      });

      if (error) throw error;

      alert('Work progress submitted successfully for verification');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting work progress:', error);
      alert('Failed to submit work progress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Upload Work Progress</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Project <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Project --</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Work Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="work_description"
              value={formData.work_description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Describe the work completed today..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Workers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="workers_count"
                value={formData.workers_count}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity Completed <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="quantity_completed"
                value={formData.quantity_completed}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., cubic meters, meters"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Work Progress Photos (Max 5) <span className="text-red-500">*</span>
            </label>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoAdd}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photos.length >= 5}
              className="w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 transition-colors flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-8 h-8 text-slate-400" />
              <span className="text-slate-600">
                {photos.length === 0 ? 'Upload Photos' : `Add More Photos (${photos.length}/5)`}
              </span>
            </button>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`Progress ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-slate-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GPS Location <span className="text-red-500">*</span>
            </label>
            {location ? (
              <div className="px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            ) : (
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
              </button>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || photos.length === 0 || !location}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
