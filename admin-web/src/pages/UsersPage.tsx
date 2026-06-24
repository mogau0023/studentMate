import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { UserProfile } from '../types';

type Row = { id: string } & UserProfile;

export function UsersPage() {
  const [mode, setMode] = useState<'recent' | 'email'>('recent');
  const [email, setEmail] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const base = collection(db, 'users');
    const q =
      mode === 'email' && email.trim()
        ? query(base, where('email', '==', email.trim()), limit(25))
        : query(base, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as UserProfile) }));
      setRows(next);
      if (next.length && !selectedId) setSelectedId(next[0].id);
    });
    return () => unsub();
  }, [mode, email, selectedId]);

  const selected = useMemo(() => rows.find((u) => u.id === selectedId) ?? null, [rows, selectedId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Users</div>
          <div className="muted">Manage user profiles and moderation flags</div>
        </div>
        <div className="row">
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="recent">Recent</option>
            <option value="email">Search by email</option>
          </select>
          {mode === 'email' ? (
            <input className="input" style={{ width: 320 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          ) : null}
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>{mode === 'email' ? 'Results' : 'Latest 50'}</div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>University</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(u.id)}>
                  <td style={{ fontWeight: u.id === selectedId ? 800 : 600 }}>{u.name ?? '—'}</td>
                  <td className="muted">{u.email ?? '—'}</td>
                  <td className="muted">{u.universityName ?? u.universityId ?? '—'}</td>
                  <td>{u.banned ? <span className="pill danger">banned</span> : <span className="muted">—</span>}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No users found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Details</div>
          {selected ? <UserDetail user={selected} /> : <div className="muted">Select a user</div>}
        </div>
      </div>
    </div>
  );
}

function UserDetail({ user }: { user: Row }) {
  const [name, setName] = useState(user.name ?? '');
  const [points, setPoints] = useState<number>(user.points ?? 0);
  const [banned, setBanned] = useState(!!user.banned);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name ?? '');
    setPoints(user.points ?? 0);
    setBanned(!!user.banned);
    setError(null);
  }, [user.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800 }}>{user.name ?? '—'}</div>
          <div className="muted">{user.email ?? user.id}</div>
        </div>
        {user.banned ? <span className="pill danger">banned</span> : <span className="pill ok">active</span>}
      </div>

      <div className="grid2">
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Display name
          </div>
          <input className="input" value={name} disabled={saving} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Points
          </div>
          <input className="input" value={String(points)} disabled={saving} onChange={(e) => setPoints(Number(e.target.value))} />
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={banned} disabled={saving} onChange={(e) => setBanned(e.target.checked)} />
          <span className="muted">Banned</span>
        </label>
        <button
          className="button primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await updateDoc(doc(db, 'users', user.id), {
                name: name.trim() || null,
                points: Number.isFinite(points) ? points : 0,
                banned,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed');
            } finally {
              setSaving(false);
            }
          }}
        >
          Save
        </button>
      </div>

      {error ? <div className="pill danger">{error}</div> : null}
      <div className="muted">
        Disabling Firebase Auth users requires an Admin SDK backend. This screen updates the profile document used by rules/clients.
      </div>
    </div>
  );
}

