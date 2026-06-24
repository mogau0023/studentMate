import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db, storage } from '../firebase';
import { University } from '../types';

type Row = { id: string } & University;

export function UniversitiesPage() {
  const { admin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canWrite = useMemo(() => admin?.role === 'superadmin', [admin]);

  useEffect(() => {
    const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as University) }));
      setRows(next);
    });
    return () => unsub();
  }, []);

  async function uploadLogo(universityId: string, file: File) {
    const path = `university-logos/${universityId}/logo_${Date.now()}_${file.name}`.replace(/\s+/g, '_');
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, file, { contentType: file.type || 'application/octet-stream' });
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        () => {},
        (e) => reject(e),
        () => resolve(),
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    return { url, path };
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Universities</div>
          <div className="muted">Add and manage universities used during registration</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800 }}>Create university</div>
          {!canWrite ? (
            <span className="pill warn">Superadmin only</span>
          ) : (
            <button className="button secondary" onClick={() => setCreating((v) => !v)}>
              {creating ? 'Close' : 'New'}
            </button>
          )}
        </div>

        {creating ? (
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              if (!canWrite) return;
              setError(null);
              try {
                const uni: University = { name: name.trim(), code: code.trim().toUpperCase() };
                if (!uni.name || !uni.code) {
                  setError('Name and code are required');
                  return;
                }
                const docRef = await addDoc(collection(db, 'universities'), { ...uni, createdAt: serverTimestamp() });
                if (logoFile) {
                  const { url } = await uploadLogo(docRef.id, logoFile);
                  await updateDoc(docRef, { logoUrl: url, updatedAt: serverTimestamp() });
                }
                setName('');
                setCode('');
                setLogoFile(null);
                setCreating(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Create failed');
              }
            }}
            style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10 }}
          >
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Name
              </div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Code
              </div>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Logo (optional)
              </div>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
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
        <div style={{ fontWeight: 800, marginBottom: 10 }}>All universities</div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Logo</th>
              <th style={{ width: 210 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UniversityRow key={u.id} row={u} canWrite={canWrite} />
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No universities yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UniversityRow({ row, canWrite }: { row: Row; canWrite: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr>
      <td>
        {editing ? <input className="input" value={name} onChange={(e) => setName(e.target.value)} /> : row.name}
      </td>
      <td style={{ width: 120 }}>
        {editing ? <input className="input" value={code} onChange={(e) => setCode(e.target.value)} /> : row.code}
      </td>
      <td style={{ width: 120 }}>
        {row.logoUrl ? (
          <a className="button secondary" href={row.logoUrl} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td>
        <div className="row">
          {editing ? (
            <>
              <button
                className="button primary"
                disabled={saving || !canWrite}
                onClick={async () => {
                  if (!canWrite) return;
                  setSaving(true);
                  setError(null);
                  try {
                    await updateDoc(doc(db, 'universities', row.id), {
                      name: name.trim(),
                      code: code.trim().toUpperCase(),
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
                  setName(row.name);
                  setCode(row.code);
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
                  if (!canWrite) return;
                  if (!confirm(`Delete university "${row.name}"?`)) return;
                  await deleteDoc(doc(db, 'universities', row.id));
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
