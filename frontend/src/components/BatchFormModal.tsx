import { useState, useEffect } from 'react';
import { api } from '../api';

interface BatchFormProps {
  open: boolean;
  onClose: () => void;
  batch?: any;
  onSaved?: (batch: any) => void;
}


    function toYMD(date?: string | Date | null): string {
      const d = date ? new Date(date) : new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }

export function BatchFormModal({ open, onClose, batch, onSaved }: BatchFormProps) {
  const [form, setForm] = useState({
    id: batch?.id || '',
    type: batch?.type || '',
    typeColor: batch?.typeColor || '#3182ce',
    start_date: batch?.start_date || '',
    end_date: batch?.end_date || '',
    days: batch?.days || '',
    origin_batch_id: batch?.origin_batch_id ?? '',
    temperature: batch?.temperature ?? '',
    comment: batch?.comment ?? '',
    result: batch?.result ?? '',
    refreshment: batch?.refreshment ?? '',
    production: batch?.production ?? '',
    total_time: batch?.total_time || '',
    final_status: batch?.final_status ?? ''
  });


  useEffect(() => {
    setForm({
      id: batch?.id || '',
      type: batch?.type || '',
      typeColor: batch?.typeColor || '#3182ce',
      start_date: toYMD(batch?.start_date || ''),
      end_date: toYMD(batch?.end_date || ''),
      days: batch?.days ?? '',
      origin_batch_id: batch?.origin_batch_id ?? '',
      temperature: batch?.temperature ?? '',
      comment: batch?.comment ?? '',
      result: batch?.result ?? '',
      refreshment: batch?.refreshment ?? '',
      production: batch?.production ?? '',
      total_time: batch?.total_time ?? '',
      final_status: batch?.final_status ?? ''
    });
  }, [batch, open]);

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();


    // Match backend expectations: strings for strings, numbers for numerics; avoid null
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



    const payload: any = {
      id: strOrEmpty(form.id), // backend expects string, not number
      type: strOrEmpty(form.type),
      start_date: strOrEmpty(form.start_date),   // prepopulated string in-field
      end_date: dateOrNull(form.end_date),       // '' when cleared
      // days is computed on the fly; omit from payload unless backend needs it
      origin_batch_id: strOrEmpty(form.origin_batch_id), // use Number(...) if backend expects number
      temperature: numOrZero(form.temperature),
      comment: strOrEmpty(form.comment),
      result: strOrEmpty(form.result),
      refreshment: strOrEmpty(form.refreshment),
      production: strOrEmpty(form.production),
      total_time: numOrZero(form.total_time),
      final_status: strOrEmpty(form.final_status),
      // typeColor is UI-only; omit if backend doesn't use it
    };

    let res;
    if (batch?.id) {
      res = await api.put(`/batches/${batch.id}`, payload);
    } else {
      res = await api.post('/batches', payload);
    }
    onSaved?.(res.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff', borderRadius: 12, padding: 32, minWidth: 340,
          boxShadow: '0 2px 12px #e2e8f0', display: 'flex', flexDirection: 'column', gap: 18
        }}
      >
        <h2 style={{ marginBottom: 8, fontWeight: 700, fontSize: '1.2rem', color: '#2d3748' }}>
          {batch?.id ? 'Edit Batch' : 'Add Batch'}
        </h2>

        <label>
          ID
          <input
            name="id"
            value={form.id ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Type
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          >
            <option value="">Select type</option>
            <option value="BASE">BASE</option>
            <option value="FINAL">FINAL</option>
          </select>
        </label>

        <label>
          Start Date
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input
              name="start_date"
              type="date"
              value={form.start_date || ''}   // in-field prepopulated
              onChange={handleChange}
              required
              placeholder="YYYY-MM-DD"
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e0' }}
            />
            {form.start_date && (
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, start_date: '' }))}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                title="Clear date"
              >
                Clear
              </button>
            )}
          </div>
        </label>

        <label>
          End Date
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input
              name="end_date"
              type="date"
              value={form.end_date || ''}     // in-field prepopulated
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e0' }}
            />
            {form.end_date && (
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, end_date: '' }))}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                title="Clear date"
              >
                Clear
              </button>
            )}
          </div>
        </label>

        <label>
          Days
          <input
            name="days"
            type="number"
            value={form.days ?? ''}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
          />
        </label>

        <label>
          Origin Batch
          <input
            name="origin_batch_id"
            value={form.origin_batch_id ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Temperature
          <input
            name="temperature"
            type="number"
            value={form.temperature ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Comment
          <input
            name="comment"
            value={form.comment ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Result
          <input
            name="result"
            value={form.result ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Production
          <input
            name="production"
            value={form.production ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          />
        </label>

        <label>
          Total Days
          <input
            name="total_time"
            type="number"
            value={form.total_time ?? ''}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
          />
        </label>

        <label>
          Final Status
          <select
            name="final_status"
            value={form.final_status ?? ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}
          >
            <option value="">Select status</option>
            <option value="OK">OK</option>
            <option value="KO">KO</option>
            <option value="LOOK">LOOK</option>
          </select>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#a0aec0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            {batch?.id ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}