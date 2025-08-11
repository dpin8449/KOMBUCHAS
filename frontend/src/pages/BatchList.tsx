import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { BatchFormModal } from '../components/BatchFormModal';

export function BatchList() {
  const [batches, setBatches] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);

  useEffect(() => {
    api.get('/batches').then(res => {
      // Sort: first batches with empty end_date, then by end_date descending, then by start_date descending
      const sorted = [...res.data].sort((a, b) => {
        // Put batches with empty end_date first
        if (!a.end_date && b.end_date) return -1;
        if (a.end_date && !b.end_date) return 1;
        // If both have end_date, sort by end_date descending
        if (a.end_date && b.end_date) {
          const endA = new Date(a.end_date).getTime();
          const endB = new Date(b.end_date).getTime();
          if (endA !== endB) return endB - endA;
        }
        // If both have empty end_date or same end_date, sort by start_date descending
        const startA = new Date(a.start_date || '').getTime();
        const startB = new Date(b.start_date || '').getTime();
        return startB - startA;
      });
      setBatches(sorted);
    });
  }, []);

  function handleEdit(batch: any) {
    setEditBatch(batch);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditBatch(null);
    setModalOpen(true);
  }

  function handleSaved(newBatch: any) {
    api.get('/batches').then(res => setBatches(res.data));
  }

  function formatDate(date: string) {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  }

  function typeColor(type: string) {
    if (!type) return '#a0aec0';
    if (type.toLowerCase().includes('base')) return '#f6e05e'; // yellow
    if (type.toLowerCase().includes('final')) return '#38a169'; // green
    return '#805ad5';
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 700, fontSize: '2rem', color: '#2d3748' }}>Kombucha Batches</h1>
        <button onClick={handleAdd} style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px #e2e8f0' }}>+ Add Batch</button>
      </div>
      <table style={{ width: '100%', marginTop: 24, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px #e2e8f0' }}>
        <thead style={{ background: '#f7fafc' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>Start Date</th>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>End Date</th>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>Origin Batch</th>
            <th style={{ padding: '12px', textAlign: 'left', color: '#4a5568', fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(b => {
            const ended = !!b.end_date;
            return (
              <tr key={b.id} style={{ background: ended ? '#f7fafc' : '#fff', color: ended ? '#a0aec0' : undefined, borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                <td style={{ padding: '12px' }}>
                  <Link to={`/batch/${b.id}`} style={{ color: ended ? '#a0aec0' : '#3182ce', fontWeight: 500 }}>{b.id}</Link>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: typeColor(b.type), color: '#fff', borderRadius: 4, padding: '2px 10px', fontWeight: 500 }}>{b.type}</span>
                </td>
                <td style={{ padding: '12px' }}>{formatDate(b.start_date)}</td>
                <td style={{ padding: '12px' }}>{formatDate(b.end_date)}</td>
                <td style={{ padding: '12px' }}>
                  {b.origin_batch_id ? (
                    <Link to={`/batch/${b.origin_batch_id}`} style={{ color: ended ? '#a0aec0' : '#805ad5', fontWeight: 500 }}>{b.origin_batch_id}</Link>
                  ) : <span style={{ color: '#a0aec0' }}>—</span>}
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handleEdit(b)} style={{ background: ended ? '#a0aec0' : '#f6ad55', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', fontWeight: 500, cursor: ended ? 'not-allowed' : 'pointer', marginRight: 8 }} disabled={ended}>Edit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <BatchFormModal open={modalOpen} onClose={() => setModalOpen(false)} batch={editBatch} onSaved={handleSaved} />
    </div>
  );
}
