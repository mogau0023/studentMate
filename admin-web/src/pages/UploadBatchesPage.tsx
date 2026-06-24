import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { UploadBatch, UploadBatchItem } from '../types';

type BatchRow = { id: string } & UploadBatch;
type ItemRow = { id: string } & UploadBatchItem;

export function UploadBatchesPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'admin_upload_batches'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const next: BatchRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as UploadBatch) }));
      setBatches(next);
      if (next.length && !selectedId) setSelectedId(next[0].id);
    });
    return () => unsub();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const q = query(collection(db, 'admin_upload_batches', selectedId, 'items'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const next: ItemRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as UploadBatchItem) }));
      setItems(next);
    });
    return () => unsub();
  }, [selectedId]);

  const selected = useMemo(() => batches.find((b) => b.id === selectedId) ?? null, [batches, selectedId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Upload Logs</div>
          <div className="muted">Batch-level logs created by the bulk upload pipeline</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Latest 50 batches</div>
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Status</th>
                <th>Done</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(b.id)}>
                  <td style={{ fontWeight: b.id === selectedId ? 800 : 600 }}>{b.id}</td>
                  <td>
                    <span className={b.status === 'completed' ? 'pill ok' : b.status === 'failed' ? 'pill danger' : 'pill'}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.completedFiles ?? 0}</td>
                  <td>{b.failedFiles ?? 0}</td>
                </tr>
              ))}
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No batches found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800 }}>Batch items</div>
              {selected ? (
                <div className="muted">
                  {selected.status} • {selected.completedFiles}/{selected.totalFiles} completed • {selected.failedFiles} failed
                </div>
              ) : (
                <div className="muted">Select a batch</div>
              )}
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
                <th>Assessment</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{i.fileName}</div>
                    <div className="muted">{i.sha256 ? i.sha256.slice(0, 10) : ''}</div>
                  </td>
                  <td>
                    <span className={i.status === 'completed' ? 'pill ok' : i.status === 'failed' ? 'pill danger' : 'pill'}>
                      {i.status}
                    </span>
                  </td>
                  <td className="muted">{(i as any).assessmentId ?? '—'}</td>
                  <td className="muted">{i.error ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No items found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

