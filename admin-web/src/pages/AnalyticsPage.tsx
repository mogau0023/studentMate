import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { Report, UserUpload } from '../types';

function dayKey(ts: any) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return 'unknown';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AnalyticsPage() {
  const [uploads, setUploads] = useState<Array<{ id: string } & UserUpload>>([]);
  const [reports, setReports] = useState<Array<{ id: string } & Report>>([]);

  useEffect(() => {
    const q = query(collection(db, 'user_uploads'), orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const next: Array<{ id: string } & UserUpload> = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as UserUpload) }));
      setUploads(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const next: Array<{ id: string } & Report> = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as Report) }));
      setReports(next);
    });
    return () => unsub();
  }, []);

  const uploadByDay = useMemo(() => {
    const map = new Map<string, { total: number; pending: number; approved: number; rejected: number; error: number }>();
    for (const u of uploads) {
      const k = dayKey(u.createdAt);
      const cur = map.get(k) ?? { total: 0, pending: 0, approved: 0, rejected: 0, error: 0 };
      cur.total += 1;
      if (u.status === 'pending') cur.pending += 1;
      if (u.status === 'approved') cur.approved += 1;
      if (u.status === 'rejected') cur.rejected += 1;
      if (u.status === 'error') cur.error += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  }, [uploads]);

  const reportsByDay = useMemo(() => {
    const map = new Map<string, { total: number; new: number; in_progress: number; resolved: number; closed: number }>();
    for (const r of reports) {
      const k = dayKey(r.createdAt);
      const cur = map.get(k) ?? { total: 0, new: 0, in_progress: 0, resolved: 0, closed: 0 };
      cur.total += 1;
      cur[r.status] += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  }, [reports]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Analytics</div>
          <div className="muted">Lightweight reporting based on Firestore activity (last 500 records)</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Uploads by day (last 30)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Total</th>
                <th>Pending</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {uploadByDay.map(([day, v]) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td>{v.total}</td>
                  <td>{v.pending}</td>
                  <td>{v.approved}</td>
                  <td>{v.rejected}</td>
                  <td>{v.error}</td>
                </tr>
              ))}
              {uploadByDay.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No data
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Reports by day (last 30)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Total</th>
                <th>New</th>
                <th>In progress</th>
                <th>Resolved</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {reportsByDay.map(([day, v]) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td>{v.total}</td>
                  <td>{v.new}</td>
                  <td>{v.in_progress}</td>
                  <td>{v.resolved}</td>
                  <td>{v.closed}</td>
                </tr>
              ))}
              {reportsByDay.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No data
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

