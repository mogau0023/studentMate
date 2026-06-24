import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db } from '../firebase';
import { AdminRecord, University } from '../types';

type Row = { id: string } & AdminRecord;
type UniRow = { id: string } & University;

export function AdminsPage() {
  const { admin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRecord['role']>('university_admin');
  const [universityId, setUniversityId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canWrite = useMemo(() => admin?.role === 'superadmin', [admin]);

  useEffect(() => {
    const q = query(collection(db, 'admins'), orderBy('email', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as AdminRecord) }));
      setRows(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: UniRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as University) }));
      setUniversities(next);
    });
    return () => unsub();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Admins</div>
          <div className="muted">Manage admin access (superadmin can grant/revoke)</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800 }}>Grant access</div>
          {!canWrite ? <span className="pill warn">Superadmin only</span> : null}
        </div>
        <form
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            if (!canWrite) return;
            setError(null);
            const id = uid.trim();
            const em = email.trim().toLowerCase();
            if (!id || !em) {
              setError('UID and email are required');
              return;
            }
            if (role === 'university_admin' && !universityId) {
              setError('University is required for university_admin');
              return;
            }
            try {
              await setDoc(
                doc(db, 'admins', id),
                {
                  email: em,
                  role,
                  universityId: role === 'university_admin' ? universityId : null,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true },
              );
              setUid('');
              setEmail('');
              setUniversityId('');
              setRole('university_admin');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed');
            }
          }}
          style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              UID
            </div>
            <input className="input" value={uid} disabled={!canWrite} onChange={(e) => setUid(e.target.value)} placeholder="Firebase Auth uid" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input className="input" value={email} disabled={!canWrite} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Role
            </div>
            <select className="select" value={role} disabled={!canWrite} onChange={(e) => setRole(e.target.value as any)}>
              <option value="superadmin">superadmin</option>
              <option value="university_admin">university_admin</option>
            </select>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              University (if university_admin)
            </div>
            <select className="select" value={universityId} disabled={!canWrite || role !== 'university_admin'} onChange={(e) => setUniversityId(e.target.value)}>
              <option value="">Select</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
          {error ? (
            <div className="pill danger" style={{ gridColumn: '1 / span 2' }}>
              {error}
            </div>
          ) : null}
          <div className="row" style={{ gridColumn: '1 / span 2', justifyContent: 'flex-end' }}>
            <button className="button primary" disabled={!canWrite} type="submit">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Admins</div>
        <table className="table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Email</th>
              <th>Role</th>
              <th>University</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <AdminRow key={r.id} row={r} canWrite={canWrite} universities={universities} />
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No admin records yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRow({ row, canWrite, universities }: { row: Row; canWrite: boolean; universities: UniRow[] }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(row.role);
  const [universityId, setUniversityId] = useState(row.universityId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr>
      <td className="muted">{row.id}</td>
      <td>{row.email}</td>
      <td>
        {editing ? (
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="superadmin">superadmin</option>
            <option value="university_admin">university_admin</option>
          </select>
        ) : (
          <span className="pill">{row.role}</span>
        )}
      </td>
      <td>
        {editing ? (
          <select className="select" value={universityId} disabled={role !== 'university_admin'} onChange={(e) => setUniversityId(e.target.value)}>
            <option value="">Select</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">{row.universityId ?? '—'}</span>
        )}
      </td>
      <td>
        <div className="row">
          {editing ? (
            <>
              <button
                className="button primary"
                disabled={!canWrite || saving}
                onClick={async () => {
                  if (!canWrite) return;
                  if (role === 'university_admin' && !universityId) {
                    setError('University required');
                    return;
                  }
                  setSaving(true);
                  setError(null);
                  try {
                    await updateDoc(doc(db, 'admins', row.id), {
                      role,
                      universityId: role === 'university_admin' ? universityId : null,
                      updatedAt: serverTimestamp(),
                    });
                    setEditing(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Save failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save
              </button>
              <button
                className="button secondary"
                disabled={saving}
                onClick={() => {
                  setRole(row.role);
                  setUniversityId(row.universityId ?? '');
                  setEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="button secondary" disabled={!canWrite} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button
                className="button danger"
                disabled={!canWrite}
                onClick={async () => {
                  if (!confirm(`Revoke admin access for ${row.email}?`)) return;
                  await deleteDoc(doc(db, 'admins', row.id));
                }}
              >
                Revoke
              </button>
            </>
          )}
          {error ? <span className="pill danger">{error}</span> : null}
        </div>
      </td>
    </tr>
  );
}

