import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db } from '../firebase';
import { Report } from '../types';

type Row = { id: string } & Report;

export function ReportsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'new' | 'in_progress' | 'resolved' | 'closed'>('new');
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'reports'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as Report) }));
      setRows(next);
      if (next.length && !selectedId) setSelectedId(next[0].id);
    });
    return () => unsub();
  }, [status, selectedId]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Reports</div>
          <div className="muted">Triage and resolve user-submitted issues</div>
        </div>
        <div className="row">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="new">new</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Latest 50</div>
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(r.id)}>
                  <td style={{ fontWeight: r.id === selectedId ? 800 : 600 }}>{r.subject}</td>
                  <td className="muted">{r.email ?? r.uid}</td>
                  <td>
                    <span className={r.status === 'new' ? 'pill warn' : r.status === 'resolved' ? 'pill ok' : 'pill'}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No reports found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Details</div>
          {selected ? <ReportDetail report={selected} handlerUid={user?.uid ?? ''} /> : <div className="muted">Select a report</div>}
        </div>
      </div>
    </div>
  );
}

function ReportDetail({ report, handlerUid }: { report: Row; handlerUid: string }) {
  const [nextStatus, setNextStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNextStatus(report.status);
    setError(null);
  }, [report.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="pill warn">{report.status}</span>
        <span className="muted">{report.email ?? report.uid}</span>
      </div>
      <div style={{ fontWeight: 800 }}>{report.subject}</div>
      <div className="panel" style={{ background: 'rgba(11,18,32,0.35)' }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{report.details}</div>
      </div>

      <div className="row">
        <select className="select" value={nextStatus} disabled={saving} onChange={(e) => setNextStatus(e.target.value as any)}>
          <option value="new">new</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
        <button
          className="button primary"
          disabled={saving || nextStatus === report.status}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await updateDoc(doc(db, 'reports', report.id), {
                status: nextStatus,
                updatedAt: serverTimestamp(),
                handledBy: handlerUid || null,
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Update failed');
            } finally {
              setSaving(false);
            }
          }}
        >
          Save
        </button>
      </div>
      {error ? <div className="pill danger">{error}</div> : null}
    </div>
  );
}

