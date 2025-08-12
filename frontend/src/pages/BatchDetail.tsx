
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { BatchFormModal } from '../components/BatchFormModal';

export function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
//  const isEdit = searchParams.get('edit') === '1';
  const [editBatch, setEditBatch] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);


  useEffect(() => {
    api.get(`/batches/${id}`).then(res => setBatch(res.data));
  }, [id]);

  if (!batch) return <div style={{ margin: '40px auto', maxWidth: 600 }}>Loading...</div>;


  function handleEdit(batch: any) {
    setEditBatch(batch);
    setModalOpen(true);
  }


  function handleBack() {
    navigate('/');
  }
  
  function handleSaved(newBatch: any) {
    api.get('/batches').then(res => setBatches(res.data));
  }

  return (
    <div style={{ margin: '40px auto', maxWidth: 600, fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e2e8f0', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2d3748' }}>Batch #{batch.id}</h2>
          <button onClick={() => handleEdit(batch)}  style={{ background: '#f6ad55', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Edit</button>
        </div>
        <div style={{ marginTop: 24, fontSize: '1.1rem', color: '#4a5568', display: 'grid', gap: '8px' }}>
          <div><strong>ID:</strong> {batch.id}</div>
          <div><strong>Type:</strong> {batch.type}</div>
          <div><strong>Start Date:</strong> {batch.start_date ? new Date(batch.start_date).toLocaleDateString('en-CA') : '—'}</div>
          <div><strong>End Date:</strong> {batch.end_date ? new Date(batch.end_date).toLocaleDateString('en-CA') : '—'}</div>
          <div><strong>Days:</strong> {batch.days ?? '—'}</div>
          <div><strong>Origin Batch:</strong> {batch.origin_batch_id ? (
            <Link to={`/batch/${batch.origin_batch_id}`}>{batch.origin_batch_id}</Link>
          ) : '—'}</div>
          <div><strong>Temperature:</strong> {batch.temperature ?? '—'}</div>
          <div><strong>Comment:</strong> {batch.comment ?? '—'}</div>
          <div><strong>Result:</strong> {batch.result ?? '—'}</div>
          <div><strong>Production:</strong> {batch.production ?? '—'}</div>
          <div><strong>Total Time:</strong> {batch.total_time ?? '—'}</div>
          <div><strong>Final Status:</strong> {batch.final_status ?? '—'}</div>
        </div>
        <div style={{ marginTop: 32 }}>
          <button onClick={handleBack} style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>← Back to list</button>
        </div>
      </div>
      <BatchFormModal open={modalOpen} onClose={() => setModalOpen(false)} batch={editBatch} onSaved={handleSaved} />
    </div>
  );
}
