import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db } from '../firebase';
import { University } from '../types';

type Announcement = {
  title: string;
  message: string;
  universityId: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type Row = { id: string } & Announcement;
type UniRow = { id: string } & University;

export function AnnouncementsPage() {
  const { admin } = useAuth();
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [universityId, setUniversityId] = useState('all');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopeUniversityId = useMemo(() => {
    if (admin?.role === 'university_admin') return admin.universityId ?? '';
    return '';
  }, [admin]);

  useEffect(() => {
    const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: UniRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as University) }));
      setUniversities(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as Announcement) }));
      setRows(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scopeUniversityId) setUniversityId(scopeUniversityId);
  }, [scopeUniversityId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Announcements</div>
          <div className="muted">Create and manage in-app announcements</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800 }}>Create announcement</div>
          <button className="button secondary" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Close' : 'New'}
          </button>
        </div>
        {creating ? (
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              setError(null);
              const rec: Announcement = {
                title: title.trim(),
                message: message.trim(),
                universityId: (scopeUniversityId || universityId).trim() || 'all',
                active,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              if (!rec.title || !rec.message) {
                setError('Title and message are required');
                return;
              }
              try {
                await addDoc(collection(db, 'announcements'), rec);
                setTitle('');
                setMessage('');
                setActive(true);
                setCreating(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Create failed');
              }
            }}
            style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            <div style={{ gridColumn: '1 / span 2' }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Title
              </div>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Message
              </div>
              <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Audience
              </div>
              <select
                className="select"
                value={scopeUniversityId || universityId}
                disabled={!!scopeUniversityId}
                onChange={(e) => setUniversityId(e.target.value)}
              >
                <option value="all">All</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Active
              </div>
              <select className="select" value={active ? 'yes' : 'no'} onChange={(e) => setActive(e.target.value === 'yes')}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {error ? (
              <div className="pill danger" style={{ gridColumn: '1 / span 2' }}>
                {error}
              </div>
            ) : null}
            <div className="row" style={{ gridColumn: '1 / span 2', justifyContent: 'flex-end' }}>
              <button className="button primary" type="submit">
                Create
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="panel">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Announcements</div>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Active</th>
              <th style={{ width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((a) => (scopeUniversityId ? a.universityId === scopeUniversityId || a.universityId === 'all' : true))
              .map((a) => (
                <AnnouncementRow key={a.id} row={a} />
              ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No announcements yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnnouncementRow({ row }: { row: Row }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [message, setMessage] = useState(row.message);
  const [active, setActive] = useState(!!row.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr>
      <td style={{ width: 360 }}>
        {editing ? <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /> : <span style={{ fontWeight: 700 }}>{row.title}</span>}
        <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
          {editing ? <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} /> : row.message}
        </div>
      </td>
      <td className="muted">{row.universityId}</td>
      <td>{row.active ? <span className="pill ok">active</span> : <span className="pill">off</span>}</td>
      <td>
        <div className="row">
          {editing ? (
            <>
              <select className="select" value={active ? 'yes' : 'no'} onChange={(e) => setActive(e.target.value === 'yes')}>
                <option value="yes">Active</option>
                <option value="no">Off</option>
              </select>
              <button
                className="button primary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    await updateDoc(doc(db, 'announcements', row.id), {
                      title: title.trim(),
                      message: message.trim(),
                      active,
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
                  setTitle(row.title);
                  setMessage(row.message);
                  setActive(!!row.active);
                  setEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="button secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button
                className="button danger"
                onClick={async () => {
                  if (!confirm(`Delete announcement "${row.title}"?`)) return;
                  await deleteDoc(doc(db, 'announcements', row.id));
                }}
              >
                Delete
              </button>
            </>
          )}
          {error ? <span className="pill danger">{error}</span> : null}
        </div>
      </td>
    </tr>
  );
}

