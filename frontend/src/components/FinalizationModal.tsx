import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

interface FinalizationModalProps {
  open: boolean;
  onClose: () => void;
  originalBatch: any; // expects fields: id, start_date, comment
  onSaved?: () => void; // callback after successful save (e.g., to refetch)
}

function toYMD(date?: string | Date | null): string {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Increment the first two digits, keep 3rd–4th the same. Example: 11B2 -> 12B2
function computeFinalId(originalId: string | number): string {
  const s = String(originalId);
  const m = s.match(/^(\d{2})(.{2,})$/);
  if (m) {
    const n = String((parseInt(m[1], 10) + 1) % 100).padStart(2, '0');
    return n + m[2];
  }
  if (s.length >= 4 && /^\d{2}..$/.test(s.slice(0, 4))) {
    const first2 = s.slice(0, 2);
    const rest = s.slice(2, 4);
    const n = String((parseInt(first2, 10) + 1) % 100).padStart(2, '0');
    return n + rest + s.slice(4);
  }
  return s + '-F';
}

export function FinalizationModal({ open, onClose, originalBatch, onSaved }: FinalizationModalProps) {
  const initialFinalId = useMemo(() => computeFinalId(originalBatch?.id ?? ''), [originalBatch?.id]);
  const initialOriginalStart = useMemo(() => toYMD(originalBatch?.start_date || null), [originalBatch?.start_date]);
  const initialToday = useMemo(() => toYMD(new Date()), []);
  const initialFinalComment = useMemo(() => (originalBatch?.comment ?? ''), [originalBatch?.comment]);

  const [form, setForm] = useState({
    // Section 1 - Original Batch (some read-only)
    originalId: String(originalBatch?.id ?? ''),
    originalStartDate: initialOriginalStart,
    originalResult: '',
    originalFinalStatus: '',
    // Section 2 - Final Batch
    finalId: initialFinalId,
    finalStartDate: initialToday,
    finalComment: initialFinalComment,
    // Section 3 - Bottle 1
    bottle1Comment: '',
    bottle1Production: '',
    // Section 4 - Bottle 2
    bottle2Comment: '',
    bottle2Production: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      originalId: String(originalBatch?.id ?? ''),
      originalStartDate: toYMD(originalBatch?.start_date || null),
      originalResult: '',
      originalFinalStatus: '',
      finalId: computeFinalId(originalBatch?.id ?? ''),
      finalStartDate: toYMD(new Date()),
      finalComment: originalBatch?.comment ?? '',
      bottle1Comment: '',
      bottle1Production: '',
      bottle2Comment: '',
      bottle2Production: '',
    });
    setErrors({});
  }, [open, originalBatch]);

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    // Section 1
    if (!form.originalResult.trim()) e.originalResult = 'Result is required.';
    if (!form.originalFinalStatus) e.originalFinalStatus = 'Final status is required.';
    // Section 2
    if (!form.finalId.trim()) e.finalId = 'Final batch ID is required.';
    if (!form.finalStartDate) e.finalStartDate = 'Start date is required.';
    if (!form.finalComment.trim()) e.finalComment = 'Comment is required.';
    // Section 3
    if (!form.bottle1Comment.trim()) e.bottle1Comment = 'Comment is required.';
    if (form.bottle1Production === '') e.bottle1Production = 'Production is required.';
    else {
      const n = Number(form.bottle1Production);
      if (!isFinite(n) || n <= 0) e.bottle1Production = 'Must be a positive number.';
    }
    // Section 4 (optional)
    if (form.bottle2Production !== '') {
      const n2 = Number(form.bottle2Production);
      if (!isFinite(n2) || n2 < 0) e.bottle2Production = 'Must be a positive number or empty.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  const strOrEmpty = (v: any) => (v === null || v === undefined ? '' : String(v));
  const numOrZero = (v: any) => {
    if (v === '' || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
    // Convert date strings: '' -> null, 'YYYY-MM-DD' -> same string
    const dateOrNull = (v: any) => {
    const s = v == null ? '' : String(v);
    return s.trim() === '' ? null : s;
    };

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!validate()) return;

    const originalIdStr = String(form.originalId);
    const bottle1Prod = Number(form.bottle1Production);
    const bottle2Prod = form.bottle2Production === '' ? undefined : Number(form.bottle2Production);
    const hasBottle2 = form.bottle2Comment.trim() !== '' || typeof bottle2Prod === 'number';

    // 1) Update the original batch
    const updateOriginal = {
      end_date: dateOrNull(form.finalStartDate),            // End Date = Section 2 - Start Date
      result: form.originalResult.trim(),       // Result from Section 1
      final_status: form.originalFinalStatus,   // Final status from Section 1
    };

    // 2) Create new BASE register (Final Batch)
    const createBase = {
      id: form.finalId.trim(),                  // Section 2 - Final Batch ID
      start_date: form.finalStartDate,          // Section 2 - Start Date
      end_date: null,
      type: 'BASE',
      production: '',
      temperature: 0,
      origin_batch_id: originalIdStr,           // Section 1 - Batch ID
      comment: form.finalComment.trim(),        // Section 2 - Comment
    };

    // 3) Create FINAL Bottle 1
    const createBottle1 = {
      id: `${originalIdStr}01`,                 // Original batch id concat '01'
      start_date: form.finalStartDate,          // Section 2 - Start Date
      end_date: null,
      type: 'FINAL',
      comment: form.bottle1Comment.trim(),      // Section 3 - Comment
      production: bottle1Prod.toString(),                  // Section 3 - Production
      origin_batch_id: originalIdStr,
    };

    // 4) Optionally create FINAL Bottle 2
    const createBottle2 = hasBottle2
      ? {
          id: `${originalIdStr}02`,             // Original batch id concat '02'
          start_date: form.finalStartDate,      // Section 2 - Start Date
          end_date: null,
          type: 'FINAL',
          comment: form.bottle2Comment.trim() || undefined,
          production: typeof bottle2Prod === 'number' ? bottle2Prod.toString()  : undefined,
          origin_batch_id: originalIdStr,
        }
      : null;

    setSubmitting(true);
    try {
      await api.put(`/batches/${encodeURIComponent(originalIdStr)}`, updateOriginal);
      await api.post('/batches', createBase);
      await api.post('/batches', createBottle1);
      if (createBottle2) await api.post('/batches', createBottle2);
      setSubmitting(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Finalize save failed', err);
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: '#fff', borderRadius: 12, padding: 32, minWidth: 480,
          boxShadow: '0 2px 12px #e2e8f0', display: 'flex', flexDirection: 'column', gap: 18
        }}
      >
        <h2 style={{ marginBottom: 8, fontWeight: 700, fontSize: '1.2rem', color: '#2d3748' }}>
          Finalize Batch
        </h2>

        {/* Section 1 - Original Batch */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1rem', color: '#4a5568' }}>
            Original Batch
          </h3>
          <label>
            BATCH ID
            <input
              name="originalId"
              value={form.originalId}
              readOnly
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
            />
          </label>
          <label>
            START DATE
            <input
              name="originalStartDate"
              value={form.originalStartDate}
              readOnly
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
            />
          </label>
          <label>
            RESULT <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="originalResult"
              value={form.originalResult}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.originalResult && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.originalResult}</div>}
          </label>
          <label>
            FINAL STATUS <span style={{ color: '#e53e3e' }}> *</span>
            <select
              name="originalFinalStatus"
              value={form.originalFinalStatus}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            >
              <option value="">Select status</option>
              <option value="OK">OK</option>
              <option value="KO">KO</option>
              <option value="LOOK">LOOK</option>
            </select>
            {errors.originalFinalStatus && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.originalFinalStatus}</div>}
          </label>
        </div>

        {/* Section 2 - Final Batch */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1rem', color: '#4a5568' }}>
            Final Batch
          </h3>
          <label>
            FINAL BATCH ID <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="finalId"
              value={form.finalId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.finalId && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.finalId}</div>}
          </label>
          <label>
            START DATE <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="finalStartDate"
              type="date"
              value={form.finalStartDate}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.finalStartDate && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.finalStartDate}</div>}
          </label>
          <label>
            COMMENT <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="finalComment"
              value={form.finalComment}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.finalComment && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.finalComment}</div>}
          </label>
        </div>

        {/* Section 3 - Bottle 1 */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1rem', color: '#4a5568' }}>
            Bottle 1
          </h3>
          <label>
            COMMENT <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="bottle1Comment"
              value={form.bottle1Comment}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.bottle1Comment && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.bottle1Comment}</div>}
          </label>
          <label>
            PRODUCTION <span style={{ color: '#e53e3e' }}> *</span>
            <input
              name="bottle1Production"
              type="number"
              min="0"
              step="0.01"
              value={form.bottle1Production}
              onChange={handleChange}
              required
              placeholder="e.g., 12.5"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.bottle1Production && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.bottle1Production}</div>}
          </label>
        </div>

        {/* Section 4 - Bottle 2 */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1rem', color: '#4a5568' }}>
            Bottle 2
          </h3>
          <label>
            COMMENT (optional)
            <input
              name="bottle2Comment"
              value={form.bottle2Comment}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
          </label>
          <label>
            PRODUCTION (optional)
            <input
              name="bottle2Production"
              type="number"
              min="0"
              step="0.01"
              value={form.bottle2Production}
              onChange={handleChange}
              placeholder="leave empty if not applicable"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
            />
            {errors.bottle2Production && <div style={{ color: '#e53e3e', fontSize: '.9em' }}>{errors.bottle2Production}</div>}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ background: '#a0aec0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
