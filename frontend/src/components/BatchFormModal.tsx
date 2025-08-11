
import { useState, useEffect } from 'react';
import { api } from '../api';

interface BatchFormProps {
  open: boolean;
  onClose: () => void;
  batch?: any;
  onSaved?: (batch: any) => void;
}


export function BatchFormModal({ open, onClose, batch, onSaved }: BatchFormProps) {
  const [form, setForm] = useState({
    type: batch?.type || '',
    typeColor: batch?.typeColor || '#3182ce',
    start_date: batch?.start_date || '',
    end_date: batch?.end_date || '',
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

  useEffect(() => {
    setForm({
      type: batch?.type || '',
      typeColor: batch?.typeColor || '#3182ce',
      start_date: batch?.start_date || '',
      end_date: batch?.end_date || '',
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
    let res;
    if (batch?.id) {
      res = await api.put(`/batches/${batch.id}`, form);
    } else {
      res = await api.post('/batches', form);
    }
    if (onSaved) onSaved(res.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 2px 12px #e2e8f0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 style={{ marginBottom: 8, fontWeight: 700, fontSize: '1.2rem', color: '#2d3748' }}>{batch?.id ? 'Edit Batch' : 'Add Batch'}</h2>
        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}>
            <option value="">Select type</option>
            <option value="BASE">BASE</option>
            <option value="FINAL">FINAL</option>
          </select>
        </label>
        <label>
          Start Date
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
          {batch?.start_date && (
            <span style={{ marginLeft: 8, color: '#718096', fontSize: '0.95em' }}>Original: {batch.start_date}</span>
          )}
        </label>
        <label>
          End Date
          <input name="end_date" type="date" value={form.end_date} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
          {batch?.end_date && (
            <span style={{ marginLeft: 8, color: '#718096', fontSize: '0.95em' }}>Original: {batch.end_date}</span>
          )}
        </label>
        <label>
          Days
          <input
            name="days"
            type="number"
            value={(() => {
              if (!form.start_date) return '';
              const start = new Date(form.start_date);
              const end = form.end_date ? new Date(form.end_date) : new Date();
              const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              return isNaN(diff) ? '' : diff;
            })()}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
          />
        </label>
        <label>
          Origin Batch
          <input name="origin_batch_id" value={form.origin_batch_id ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
        </label>
        <label>
          Temperature
          <input name="temperature" type="number" value={form.temperature ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
        </label>
        <label>
          Comment
          <input name="comment" value={form.comment ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
        </label>
        <label>
          Result
          <input name="result" value={form.result ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
        </label>
        <label>
          Production
          <input name="production" value={form.production ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }} />
        </label>
        <label>
          Total Time
          <input
            name="total_time"
            type="number"
            value={(() => {
              // Calculate days for current batch
              let days = 0;
              if (form.start_date) {
                const start = new Date(form.start_date);
                const end = form.end_date ? new Date(form.end_date) : new Date();
                days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              }
              if (form.type === 'BASE') return days;
              // For FINAL, sum days of current and origin batch
              if (form.type === 'FINAL' && batch?.origin_batch_days) {
                return days + batch.origin_batch_days;
              }
              return days;
            })()}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4, background: '#edf2f7' }}
          />
        </label>
        <label>
          Final Status
          <select name="final_status" value={form.final_status ?? ''} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0', marginTop: 4 }}>
            <option value="">Select status</option>
            <option value="OK">OK</option>
            <option value="KO">KO</option>
            <option value="LOOK">LOOK</option>
          </select>
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ background: '#a0aec0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>{batch?.id ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}
