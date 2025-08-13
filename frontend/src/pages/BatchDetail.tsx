import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { BatchFormModal } from '../components/BatchFormModal';
import { FinalizationModal } from '../components/FinalizationModal';

type Batch = {
  id: number | string;
  type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  days?: number | null;
  origin_batch_id?: number | string | null;
  temperature?: number | null;
  comment?: string | null;
  result?: string | null;
  production?: string | null;
  total_time?: number | null;
  final_status?: string | null;
};

type BatchOrigin = Batch;

const s: Record<string, React.CSSProperties> = {
  page: { margin: '40px auto', maxWidth: 720, fontFamily: 'Inter, Arial, sans-serif' },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e2e8f0', padding: 28 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontWeight: 700, fontSize: '1.5rem', color: '#2d3748', margin: 0 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },
  section: { marginTop: 20 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    rowGap: 12,
    columnGap: 16,
    alignItems: 'center',
    fontSize: '1rem',
  },
  label: {
    color: '#718096',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '.02em',
    fontSize: '0.85rem',
  },
  value: { color: '#2d3748', wordBreak: 'break-word' as const },
};

const btn = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.95rem',
});

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
    return d
      .toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-');
  }


function calcDays(start_date?: string | null, end_date?: string | null, days?: number | null): number | null {

  if (!start_date) return null;
  const start = new Date(start_date);
  const end = end_date ? new Date(end_date) : new Date();
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isNaN(diff) ? null : diff;
}

function fmt(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{children}</div>
    </>
  );
}

export function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batchOrigin, setBatchOrigin] = useState<BatchOrigin | null>(null);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);

  const [finalizeOpen, setFinalizeOpen] = useState(false);

  // Load current batch by route id
  useEffect(() => {
    if (!id) return;
    api.get(`/batches/${encodeURIComponent(String(id))}`).then((res) => setBatch(res.data));
  }, [id]);

  // Load origin batch whenever the loaded batch has an origin_batch_id
  useEffect(() => {
    let cancelled = false;

    async function loadOrigin() {
      const originId = batch?.origin_batch_id;
      if (!originId) {
        setBatchOrigin(null);
        return;
      }
      setLoadingOrigin(true);
      try {
        const res = await api.get(`/batches/${encodeURIComponent(String(originId))}`);
        if (!cancelled) setBatchOrigin(res.data);
      } catch (e) {
        console.error('[FE] Failed to load origin batch', originId, e);
        if (!cancelled) setBatchOrigin(null);
      } finally {
        if (!cancelled) setLoadingOrigin(false);
      }
    }

    loadOrigin();
    return () => {
      cancelled = true;
    };
  }, [batch?.origin_batch_id]);

  // Derived values for display and for Edit modal prefill
  const display = useMemo(() => {
    if (!batch) return null;

    const isBase = (batch.type || '').toUpperCase() === 'BASE';
    const isFinal = (batch.type || '').toUpperCase() === 'FINAL';

    const batchDays = calcDays(batch.start_date, batch.end_date, batch.days);
    const originDays = calcDays(
      batchOrigin?.start_date,
      batchOrigin?.end_date,
      batchOrigin?.days ?? null
    );

    // Total Days rule for display:
    // - BASE: batch.total_time
    // - FINAL: batchDays + originDays
    let totalDaysDisplay: string = '—';
    if (isBase) {
      totalDaysDisplay =
        batch.total_time === null || batch.total_time === undefined
          ? '—'
          : String(batchDays);
    } else if (isFinal) {
      const total =
        (batchDays != null ? batchDays : 0) + (originDays != null ? originDays : 0);
      totalDaysDisplay = batchDays == null && originDays == null ? '—' : String(total);
    }

    return {
      id: batch.id,
      type: fmt(batch.type),
      startDate: formatDate(batch.start_date),
      endDate: formatDate(batch.end_date),
      days: batchDays != null ? String(batchDays) : '—',
      originLink: batch.origin_batch_id ? (
        <Link to={`/batch/${encodeURIComponent(String(batch.origin_batch_id))}`}>
          {String(batch.origin_batch_id)}
        </Link>
      ) : (
        '—'
      ),
      temperature:
        batch.temperature === null || batch.temperature === undefined ? '—' : batch.temperature,
      comment: fmt(batch.comment),
      result: fmt(batch.result),
      production: fmt(batch.production),
      totalTime: totalDaysDisplay,
      finalStatus: fmt(batch.final_status),

      // Pass raw numbers needed for edit prefill
      _raw: {
        batchDays,
        originDays,
        isBase,
        isFinal
      },
    };
  }, [batch, batchOrigin]);

  if (!batch || !display) {
    return <div style={{ margin: '40px auto', maxWidth: 600 }}>Loading...</div>;
  }

  function handleEdit() {
    if (!batch || !display) return; // ensure non-null

    const raw = display._raw as {
      batchDays: number | null;
      originDays: number | null;
      isBase: boolean;
      isFinal: boolean;
      baseTotalTime: number | null;
    };

    const batchDaysNum = raw.batchDays ?? null;
    const originDaysNum = raw.originDays ?? null;

    let total_time_for_edit: number | null = null;
    if (raw.isFinal) {
      total_time_for_edit = (batchDaysNum ?? 0) + (originDaysNum ?? 0);
    } else if (raw.isBase) {
      total_time_for_edit = batchDaysNum;
    }

    // Explicitly set id so it’s not inferred as possibly undefined
    const editable: Batch = {
      ...batch, // spread the rest
      days: batchDaysNum,
      total_time: total_time_for_edit,
    };

    setEditBatch(editable);
    setModalOpen(true);
  }

  function handleBack() {
    navigate('/');
  }

  function handleSaved() {
    if (!id) return;
    api.get(`/batches/${encodeURIComponent(String(id))}`).then((res) => setBatch(res.data));
  }

  async function handleDelete() {
    if (!batch) return;
    const ok = window.confirm(`Delete batch ${batch.id}? This cannot be undone.`);
    if (!ok) return;
    await api.delete(`/batches/${encodeURIComponent(String(batch.id))}`);
    navigate('/');
  }

  const isBase = (batch.type || '').toUpperCase() === 'BASE';

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.title}>Batch #{display.id}</h2>
          <div style={s.actions}>
            {isBase && (
              <button onClick={() => setFinalizeOpen(true)} style={btn('#38a169')}>
                Finalize…
              </button>
            )}
            <button onClick={handleEdit} style={btn('#f6ad55')}>Edit</button>
            <button onClick={handleDelete} style={btn('#e53e3e')}>Delete</button>
            <button onClick={handleBack} style={btn('#3182ce')}>← Back to list</button>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.grid}>
            <Field label="ID">{display.id}</Field>
            <Field label="Type">{display.type}</Field>
            <Field label="Start Date">{display.startDate}</Field>
            <Field label="End Date">{display.endDate}</Field>
            <Field label="Days">{display.days}</Field>
            <Field label="Origin Batch">
              {display.originLink}
              {batch.origin_batch_id && (
                <span style={{ marginLeft: 8, color: '#718096', fontSize: '0.9em' }}>
                  {loadingOrigin
                    ? '(loading origin…)'
                    : batchOrigin
                      ? `(origin days: ${display._raw.originDays ?? '—'})`
                      : '(origin not found)'}
                </span>
              )}
            </Field>
            <Field label="Temperature">
              {display.temperature !== '—' ? <>{display.temperature} °C</> : '—'}
            </Field>
            <Field label="Comment">{display.comment}</Field>
            <Field label="Result">{display.result}</Field>
            <Field label="Production">{display.production}</Field>
            <Field label="Total Days">{display.totalTime}</Field>
            <Field label="Final Status">{display.finalStatus}</Field>
          </div>
        </div>
      </div>

      <BatchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        batch={editBatch}
        onSaved={handleSaved}
      />

      <FinalizationModal
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        originalBatch={batch}
        onSaved={() => {
          handleSaved();
        }}
      />
    </div>
  );
}