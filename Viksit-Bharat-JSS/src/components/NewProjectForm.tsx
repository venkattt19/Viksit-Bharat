import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Upload, MapPin } from 'lucide-react';

interface NewProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectForm({ onClose, onSuccess }: NewProjectFormProps) {
  const { officer } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    estimated_workers: '',
    work_type: '',
    work_quantity: '',
    materials: '',
    start_date: '',
    end_date: '',
    budget: '',
    latitude: '',
    longitude: '',
  });

  const [sitePhoto, setSitePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const projectTypes = [
    'Pond',
    'Road',
    'Irrigation',
    'Plantation',
    'School Building',
    'Community Center',
    'Water Supply',
    'Drainage',
    'Other Infrastructure'
  ];

  const workTypes = [
    'Excavation',
    'Construction',
    'Repair',
    'Plantation',
    'Earth Work',
    'Concrete Work',
    'Brick Work',
    'Plastering',
    'Painting',
    'Digging',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get location. Please enter coordinates manually.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size should be less than 5MB');
        return;
      }
      setSitePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSitePhoto = async (): Promise<string | null> => {
    if (!sitePhoto || !officer) return null;

    setUploadingPhoto(true);
    try {
      const timestamp = new Date().toISOString();
      const fileName = `project-site-${officer.id}-${timestamp}-${sitePhoto.name}`;

      const { data, error } = await supabase.storage
        .from('project-documents')
        .upload(fileName, sitePhoto);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload site photo');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!officer) {
      alert('Officer information not found');
      return;
    }

    if (!sitePhoto) {
      alert('Please upload a site photo');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      alert('Please provide GPS coordinates');
      return;
    }

    setLoading(true);

    try {
      const photoUrl = await uploadSitePhoto();
      if (!photoUrl) {
        throw new Error('Failed to upload site photo');
      }

      const materialsArray = formData.materials
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const projectCode = `PRJ-${officer.jurisdiction.village?.substring(0, 3).toUpperCase()}-${Date.now()}`;

      const { error } = await supabase.from('projects').insert({
        project_code: projectCode,
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        village: officer.jurisdiction.village,
        block: officer.jurisdiction.block,
        district: officer.jurisdiction.district,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
        estimated_workers: parseInt(formData.estimated_workers),
        work_details: {
          type: formData.work_type,
          quantity: formData.work_quantity,
        },
        materials_required: materialsArray,
        budget: parseFloat(formData.budget),
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'pending_block_approval',
        site_photos: [photoUrl],
        created_by: officer.id,
      });

      if (error) throw error;

      alert('Project submitted successfully for Block Officer approval');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Village Road Construction"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Describe the project details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                name="project_type"
                value={formData.project_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Workers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="estimated_workers"
                value={formData.estimated_workers}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Number of workers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type of Work <span className="text-red-500">*</span>
              </label>
              <select
                name="work_type"
                value={formData.work_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select work type</option>
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expected Work Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="work_quantity"
                value={formData.work_quantity}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 2 km, 500 cubic meters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Village
              </label>
              <input
                type="text"
                value={officer?.jurisdiction.village || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Block
              </label>
              <input
                type="text"
                value={officer?.jurisdiction.block || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={officer?.jurisdiction.district || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                GPS Coordinates <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Latitude"
                />
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Longitude"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  {gettingLocation ? 'Getting...' : 'Get Location'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Completion Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Budget (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Total estimated budget"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Required Materials <span className="text-red-500">*</span>
              </label>
              <textarea
                name="materials"
                value={formData.materials}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter materials separated by commas (e.g., Cement, Sand, Bricks, Steel)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Site Photo with Geolocation <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600"
                >
                  <Upload className="w-5 h-5" />
                  {sitePhoto ? 'Change Photo' : 'Upload Site Photo'}
                </button>
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Site preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-slate-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingPhoto}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading || uploadingPhoto ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {uploadingPhoto ? 'Uploading Photo...' : 'Submitting...'}
                </>
              ) : (
                'Submit for Approval'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
