import { collection, getCountFromServer, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { Report, UserUpload } from '../types';
import { useAuth } from '../auth';

type Stat = { label: string; value: string; hint?: string };

export function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [pendingUploads, setPendingUploads] = useState<Array<{ id: string } & UserUpload>>([]);
  const [newReports, setNewReports] = useState<Array<{ id: string } & Report>>([]);

  const canScopeToUniversity = useMemo(() => admin?.role === 'university_admin' && !!admin.universityId, [admin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const usersCount = await getCountFromServer(collection(db, 'users'));
      const universitiesCount = await getCountFromServer(collection(db, 'universities'));
      const modulesCount = await getCountFromServer(collection(db, 'modules'));

      const assessmentsBase = collection(db, 'assessments');
      const assessmentsQ = canScopeToUniversity
        ? query(assessmentsBase, where('universityId', '==', admin!.universityId))
        : assessmentsBase;
      const assessmentsCount = await getCountFromServer(assessmentsQ as any);

      const uploadsBase = collection(db, 'user_uploads');
      const uploadsQ = query(uploadsBase, where('status', '==', 'pending'));
      const pendingCount = await getCountFromServer(uploadsQ);

      const reportsBase = collection(db, 'reports');
      const reportsQ = query(reportsBase, where('status', '==', 'new'));
      const newReportsCount = await getCountFromServer(reportsQ);

      if (cancelled) return;
      setStats([
        { label: 'Users', value: String(usersCount.data().count) },
        { label: 'Universities', value: String(universitiesCount.data().count) },
        { label: 'Modules', value: String(modulesCount.data().count) },
        { label: 'Assessments', value: String(assessmentsCount.data().count) },
        { label: 'Pending Uploads', value: String(pendingCount.data().count) },
        { label: 'New Reports', value: String(newReportsCount.data().count) },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, canScopeToUniversity]);

  useEffect(() => {
    const uploadsQ = query(
      collection(db, 'user_uploads'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
    const unsub = onSnapshot(uploadsQ, (snap) => {
      const rows: Array<{ id: string } & UserUpload> = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as UserUpload) }));
      setPendingUploads(rows);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const reportsQ = query(collection(db, 'reports'), where('status', '==', 'new'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(reportsQ, (snap) => {
      const rows: Array<{ id: string } & Report> = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as Report) }));
      setNewReports(rows);
    });
    return () => unsub();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Dashboard</div>
          <div className="muted">Live overview and moderation signals</div>
        </div>
      </div>

      <div className="grid3" style={{ marginBottom: 12 }}>
        {stats.map((s) => (
          <div key={s.label} className="panel">
            <div className="muted">{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{s.value}</div>
            {s.hint ? <div className="muted">{s.hint}</div> : null}
          </div>
        ))}
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800 }}>Pending user uploads</div>
              <div className="muted">Newest 10</div>
            </div>
            <a className="button secondary" href="/user-uploads">
              Open
            </a>
          </div>
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Module</th>
                <th>Year</th>
                <th>Title</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {pendingUploads.map((u) => (
                <tr key={u.id}>
                  <td>{u.moduleCode}</td>
                  <td>{u.year}</td>
                  <td>{u.title}</td>
                  <td className="muted">{u.email ?? u.uid}</td>
                </tr>
              ))}
              {pendingUploads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No pending uploads
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800 }}>New reports</div>
              <div className="muted">Newest 10</div>
            </div>
            <a className="button secondary" href="/reports">
              Open
            </a>
          </div>
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {newReports.map((r) => (
                <tr key={r.id}>
                  <td>{r.subject}</td>
                  <td className="muted">{r.email ?? r.uid}</td>
                  <td>
                    <span className="pill warn">{r.status}</span>
                  </td>
                </tr>
              ))}
              {newReports.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No new reports
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
