import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  adminGetCampaigns,
  adminCreateCampaign,
  adminUpdateCampaign,
} from '../api/adminApi';
import { formatINR, formatDate } from '../utils/formatters';

const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetAmount: z
    .string()
    .min(1, 'Target amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid positive amount'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'closed']),
});

const STATUS_CLASSES = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

function ProgressBar({ raised, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatINR(raised)}</span>
        <span>{formatINR(target)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% of target raised`}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <div
          className="bg-secondary h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{pct}% raised</p>
    </div>
  );
}

function CampaignModal({ campaign, onClose, onSaved }) {
  const isEdit = Boolean(campaign?._id);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [previewImg, setPreviewImg] = useState(campaign?.image || '');

  const defaultValues = {
    title: campaign?.title || '',
    description: campaign?.description || '',
    targetAmount: campaign?.targetAmount ? String(campaign.targetAmount / 100) : '',
    startDate: campaign?.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
    endDate: campaign?.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
    status: campaign?.status || 'active',
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(campaignSchema), defaultValues });

  const onSubmit = async (data) => {
    setSaving(true);
    setServerError('');
    try {
      // Build FormData for multipart (image upload)
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      // Convert ₹ to paise
      formData.append('targetAmount', String(Math.round(Number(data.targetAmount) * 100)));
      formData.append('status', data.status);
      if (data.startDate) formData.append('startDate', data.startDate);
      if (data.endDate) formData.append('endDate', data.endDate);

      const fileInput = document.getElementById('campaign-image');
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      }

      let res;
      if (isEdit) {
        res = await adminUpdateCampaign(campaign._id, formData);
      } else {
        res = await adminCreateCampaign(formData);
      }

      const saved = res.data?.data;
      if (saved?.image) setPreviewImg(saved.image);
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImg(url);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit campaign' : 'Create campaign'}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto sm:py-8 sm:px-4"
    >
      <div className="bg-white sm:rounded-lg shadow-xl w-full sm:max-w-lg min-h-screen sm:min-h-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'अभियान संपादित करें / Edit Campaign' : 'नया अभियान / Create Campaign'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-gray-400 rounded">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data" className="px-6 py-4 space-y-4">
          {serverError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {serverError}
            </div>
          )}

          <FormField label="Title" error={errors.title?.message} htmlFor="c-title">
            <input id="c-title" {...register('title')} className="form-input w-full text-sm" placeholder="Campaign title" />
          </FormField>

          <FormField label="Description" htmlFor="c-desc">
            <textarea id="c-desc" {...register('description')} rows={3} className="form-textarea w-full text-sm" placeholder="Campaign description" />
          </FormField>

          <FormField label="Target Amount (₹)" error={errors.targetAmount?.message} htmlFor="c-target">
            <input
              id="c-target"
              type="number"
              min="1"
              step="1"
              {...register('targetAmount')}
              className="form-input w-full text-sm"
              placeholder="Amount in Rupees (e.g. 50000)"
            />
            <p className="text-xs text-gray-400 mt-0.5">Enter in Rupees — stored as paise internally.</p>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" htmlFor="c-start">
              <input id="c-start" type="date" {...register('startDate')} className="form-input w-full text-sm" />
            </FormField>
            <FormField label="End Date" htmlFor="c-end">
              <input id="c-end" type="date" {...register('endDate')} className="form-input w-full text-sm" />
            </FormField>
          </div>

          <FormField label="Status" error={errors.status?.message} htmlFor="c-status">
            <select id="c-status" {...register('status')} className="form-select w-full text-sm">
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </FormField>

          {/* Image upload */}
          <div>
            <label htmlFor="campaign-image" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Image
            </label>
            <input
              id="campaign-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-300 file:rounded file:text-sm file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
            {previewImg && (
              <img
                src={previewImg}
                alt="Campaign image preview"
                className="mt-2 h-24 w-auto object-cover rounded border border-gray-200"
              />
            )}
          </div>

          <div className="flex gap-3 pt-2 justify-end border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
              रद्द / Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-secondary text-white rounded hover:bg-green-700 disabled:opacity-60 font-medium"
            >
              {saving ? 'सहेज रहा है…' : isEdit ? 'अपडेट / Update' : 'बनाएं / Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, error, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p role="alert" className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalCampaign, setModalCampaign] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetCampaigns();
      setCampaigns(res.data?.data || []);
    } catch {
      setError('अभियान लोड नहीं हो सके / Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main role="main" className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primaryText">अभियान प्रबंधन / Campaign Management</h1>
            <button
              onClick={() => setModalCampaign(undefined)}
              className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded hover:bg-green-700"
            >
              + नया अभियान / New Campaign
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">{error}</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
              कोई अभियान नहीं / No campaigns found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <div key={c._id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                  )}
                  <ProgressBar raised={c.raisedAmount || 0} target={c.targetAmount || 0} />
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    {c.startDate && <span>Start: {formatDate(c.startDate)}</span>}
                    {c.endDate && <span>End: {formatDate(c.endDate)}</span>}
                  </div>
                  <button
                    onClick={() => setModalCampaign(c)}
                    className="mt-auto text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 self-start"
                  >
                    संपादित / Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {modalCampaign !== null && (
            <CampaignModal
              campaign={modalCampaign}
              onClose={() => setModalCampaign(null)}
              onSaved={() => fetchCampaigns()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
