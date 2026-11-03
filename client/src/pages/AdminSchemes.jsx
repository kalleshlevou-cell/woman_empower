import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  adminGetSchemes,
  adminCreateScheme,
  adminUpdateScheme,
  adminDeleteScheme,
  adminApproveDraft,
} from '../api/adminApi';
import { formatDate } from '../utils/formatters';
import { MP_DISTRICTS, SCHEME_NEEDS } from '../utils/constants';
import { useToast } from '../components/Toast';

const LIMIT = 10;

const schemeSchema = z.object({
  title_hi: z.string().min(1, 'शीर्षक (हिन्दी) आवश्यक है'),
  title_en: z.string().min(1, 'Title (English) is required'),
  description_hi: z.string().optional(),
  description_en: z.string().optional(),
  need: z.enum(['health', 'livelihood', 'pension', 'maternity', 'education', 'housing'], {
    errorMap: () => ({ message: 'Please select a need' }),
  }),
  category: z.string().optional(),
  districts: z.array(z.string()).optional(),
  benefits: z.string().optional(),
  documents: z.string().optional(),
  applicationProcess: z.string().optional(),
  officialUrl: z.string().optional(),
  lastCheckedAt: z.string().optional(),
  helpCentre: z.string().optional(),
  status: z.enum(['draft', 'published']),
  eligibilityCriteria: z
    .array(
      z.object({
        field: z.string().min(1, 'Field required'),
        operator: z.enum(['eq', 'gte', 'lte', 'includes', 'bool']),
        value: z.string().min(1, 'Value required'),
      })
    )
    .optional(),
});

const STATUS_CLASSES = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
};

function AIDraftBadge({ aiDraftApproved, aiDraft_hi, onApprove, approving }) {
  if (!aiDraft_hi) return null;
  return (
    <div className={`rounded-lg border p-3 mt-3 ${aiDraftApproved ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            aiDraftApproved ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
          }`}
        >
          {aiDraftApproved ? '✓ Approved' : 'AI Draft - समीक्षा करें'}
        </span>
        {!aiDraftApproved && (
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            className="text-xs px-3 py-1 bg-secondary text-white rounded hover:bg-green-700 disabled:opacity-60"
          >
            {approving ? '…' : 'Approve AI Draft'}
          </button>
        )}
      </div>
      <textarea
        readOnly
        value={aiDraft_hi}
        rows={3}
        className="w-full text-sm bg-white border border-gray-200 rounded px-2 py-1 font-devanagari text-gray-700 resize-none"
        aria-label="AI-generated Hindi draft (read-only)"
      />
    </div>
  );
}

function SchemeModal({ scheme, onClose, onSaved }) {
  const isEdit = Boolean(scheme?._id);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [savedScheme, setSavedScheme] = useState(isEdit ? scheme : null);
  const [approving, setApproving] = useState(false);
  const { toast } = useToast();

  const defaultValues = {
    title_hi: scheme?.title_hi || '',
    title_en: scheme?.title_en || '',
    description_hi: scheme?.description_hi || '',
    description_en: scheme?.description_en || '',
    need: scheme?.need || 'health',
    category: scheme?.category || '',
    districts: scheme?.districts || [],
    benefits: scheme?.benefits || '',
    documents: Array.isArray(scheme?.documents) ? scheme.documents.join(', ') : (scheme?.documents || ''),
    applicationProcess: scheme?.applicationProcess || '',
    officialUrl: scheme?.officialUrl || '',
    lastCheckedAt: scheme?.lastCheckedAt
      ? new Date(scheme.lastCheckedAt).toISOString().split('T')[0]
      : '',
    helpCentre: scheme?.helpCentre || '',
    status: scheme?.status || 'draft',
    eligibilityCriteria: scheme?.eligibilityCriteria?.length
      ? scheme.eligibilityCriteria.map((c) => ({
          ...c,
          value: String(c.value),
        }))
      : [],
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schemeSchema), defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: 'eligibilityCriteria' });

  const onSubmit = async (data) => {
    setSaving(true);
    setServerError('');
    try {
      const payload = {
        ...data,
        documents: data.documents
          ? data.documents.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        eligibilityCriteria: (data.eligibilityCriteria || []).map((c) => ({
          ...c,
          value: c.value,
        })),
      };
      let res;
      if (isEdit) {
        res = await adminUpdateScheme(scheme._id, payload);
      } else {
        res = await adminCreateScheme(payload);
      }
      const saved = res.data?.data;
      setSavedScheme(saved);
      onSaved();
      toast.success('Scheme saved successfully');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!savedScheme?._id) return;
    setApproving(true);
    try {
      const res = await adminApproveDraft(savedScheme._id);
      setSavedScheme(res.data?.data);
      onSaved();
      toast.success('Hindi summary approved and published');
    } catch {
      // ignore
    } finally {
      setApproving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit scheme' : 'Create scheme'}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto sm:py-8 sm:px-4"
    >
      <div className="bg-white sm:rounded-lg shadow-xl w-full sm:max-w-2xl min-h-screen sm:min-h-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'योजना संपादित करें / Edit Scheme' : 'नई योजना / Create Scheme'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-4 space-y-4">
          {serverError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {serverError}
            </div>
          )}

          {/* AI Draft (shown after create/edit when aiDraft_hi present) */}
          {savedScheme?.aiDraft_hi && (
            <AIDraftBadge
              aiDraft_hi={savedScheme.aiDraft_hi}
              aiDraftApproved={savedScheme.aiDraftApproved}
              onApprove={handleApprove}
              approving={approving}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="शीर्षक (हिन्दी) / Title (Hindi)" error={errors.title_hi?.message} htmlFor="title_hi">
              <input
                id="title_hi"
                {...register('title_hi')}
                className="form-input w-full text-sm font-devanagari"
                placeholder="हिन्दी में शीर्षक"
              />
            </FormField>
            <FormField label="Title (English)" error={errors.title_en?.message} htmlFor="title_en">
              <input
                id="title_en"
                {...register('title_en')}
                className="form-input w-full text-sm"
                placeholder="Scheme title in English"
              />
            </FormField>
          </div>

          <FormField label="विवरण (हिन्दी) / Description (Hindi)" htmlFor="description_hi">
            <textarea
              id="description_hi"
              {...register('description_hi')}
              rows={3}
              className="form-textarea w-full text-sm font-devanagari"
              placeholder="हिन्दी में विवरण"
            />
          </FormField>

          <FormField label="Description (English)" htmlFor="description_en">
            <textarea
              id="description_en"
              {...register('description_en')}
              rows={3}
              className="form-textarea w-full text-sm"
              placeholder="Scheme description in English"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Need" error={errors.need?.message} htmlFor="need">
              <select id="need" {...register('need')} className="form-select w-full text-sm">
                {SCHEME_NEEDS.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.hi} / {n.en}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Category" htmlFor="category">
              <input
                id="category"
                {...register('category')}
                className="form-input w-full text-sm"
                placeholder="e.g. Central, State"
              />
            </FormField>
          </div>

          {/* Districts multi-select */}
          <FormField label="जिले / Districts (select multiple)" htmlFor="districts">
            <select
              id="districts"
              multiple
              {...register('districts')}
              className="form-multiselect w-full text-sm"
              size={5}
            >
              {MP_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FormField>

          <FormField label="लाभ / Benefits" htmlFor="benefits">
            <textarea
              id="benefits"
              {...register('benefits')}
              rows={2}
              className="form-textarea w-full text-sm"
              placeholder="Benefits of the scheme"
            />
          </FormField>

          <FormField label="आवश्यक दस्तावेज / Documents Required (comma-separated)" htmlFor="documents">
            <input
              id="documents"
              {...register('documents')}
              className="form-input w-full text-sm"
              placeholder="Aadhaar, BPL Card, Photo"
            />
          </FormField>

          <FormField label="आवेदन प्रक्रिया / Application Process" htmlFor="applicationProcess">
            <textarea
              id="applicationProcess"
              {...register('applicationProcess')}
              rows={2}
              className="form-textarea w-full text-sm"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Official URL" htmlFor="officialUrl">
              <input
                id="officialUrl"
                {...register('officialUrl')}
                type="url"
                className="form-input w-full text-sm"
                placeholder="https://..."
              />
            </FormField>
            <FormField label="अंतिम जाँच तारीख / Last Checked At" htmlFor="lastCheckedAt">
              <input
                id="lastCheckedAt"
                {...register('lastCheckedAt')}
                type="date"
                className="form-input w-full text-sm"
              />
            </FormField>
          </div>

          <FormField label="Help Centre" htmlFor="helpCentre">
            <input
              id="helpCentre"
              {...register('helpCentre')}
              className="form-input w-full text-sm"
              placeholder="Address or phone number"
            />
          </FormField>

          <FormField label="Status" error={errors.status?.message} htmlFor="status">
            <select id="status" {...register('status')} className="form-select w-full text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </FormField>

          {/* Eligibility Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                पात्रता मानदंड / Eligibility Criteria
              </label>
              <button
                type="button"
                onClick={() => append({ field: '', operator: 'eq', value: '' })}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
              >
                + Add Row
              </button>
            </div>
            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <input
                      {...register(`eligibilityCriteria.${idx}.field`)}
                      placeholder="field (e.g. age)"
                      className="form-input text-xs flex-1 min-w-0"
                    />
                    <select
                      {...register(`eligibilityCriteria.${idx}.operator`)}
                      className="form-select text-xs w-24"
                    >
                      <option value="eq">eq</option>
                      <option value="gte">gte</option>
                      <option value="lte">lte</option>
                      <option value="includes">includes</option>
                      <option value="bool">bool</option>
                    </select>
                    <input
                      {...register(`eligibilityCriteria.${idx}.value`)}
                      placeholder="value"
                      className="form-input text-xs flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      aria-label="Remove criterion"
                      className="text-red-500 hover:text-red-700 text-sm px-1"
                    >
                      ✕
                    </button>
                    {errors.eligibilityCriteria?.[idx]?.field && (
                      <p className="text-red-600 text-xs">{errors.eligibilityCriteria[idx].field.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              रद्द करें / Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-secondary text-white rounded hover:bg-green-700 disabled:opacity-60 font-medium"
            >
              {saving ? 'सहेज रहा है…' : isEdit ? 'अपडेट करें / Update' : 'बनाएं / Create'}
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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p role="alert" className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalScheme, setModalScheme] = useState(null); // null=closed, undefined=create, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetSchemes({ page, limit: LIMIT });
      const { schemes: s, total: t } = res.data?.data || {};
      setSchemes(s || []);
      setTotal(t || 0);
    } catch {
      setError('योजनाएं लोड नहीं हो सकीं / Could not load schemes.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteScheme(deleteTarget._id);
      setDeleteTarget(null);
      fetchSchemes();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main role="main" className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primaryText">योजना प्रबंधन / Scheme Management</h1>
            <button
              onClick={() => setModalScheme(undefined)}
              className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded hover:bg-green-700"
            >
              + नई योजना / New Scheme
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">{error}</div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">शीर्षक / Title</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Need</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">अंतिम जाँच / Last Checked</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schemes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          कोई योजना नहीं / No schemes found.
                        </td>
                      </tr>
                    ) : (
                      schemes.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <span className="font-devanagari">{s.title_hi}</span>
                            <br />
                            <span className="text-xs text-gray-500">{s.title_en}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{s.need}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[s.status] || 'bg-gray-100 text-gray-700'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(s.lastCheckedAt)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setModalScheme(s)}
                                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                              >
                                संपादित / Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(s)}
                                className="text-xs px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                              >
                                हटाएं / Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Create / Edit Modal */}
          {modalScheme !== null && (
            <SchemeModal
              scheme={modalScheme}
              onClose={() => setModalScheme(null)}
              onSaved={() => fetchSchemes()}
            />
          )}

          {/* Delete Confirm Dialog */}
          {deleteTarget && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm delete scheme"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            >
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  योजना हटाएं / Delete Scheme
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  क्या आप &quot;<span className="font-devanagari font-medium">{deleteTarget.title_hi}</span>&quot; को Draft में ले जाना चाहते हैं? यह क्रिया पूर्ववत नहीं होगी।
                  <br />
                  <span className="text-xs text-gray-400">(Soft-delete: sets status to Draft)</span>
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    रद्द / Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? '…' : 'हटाएं / Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
