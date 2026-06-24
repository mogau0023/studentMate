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
  where,
} from 'firebase/firestore';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db } from '../firebase';
import { ModuleRecord, University } from '../types';

type UniRow = { id: string } & University;
type ModRow = { id: string } & ModuleRecord;

export function ModulesPage() {
  const { admin } = useAuth();
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [rows, setRows] = useState<ModRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scopeUniversityId = useMemo(() => {
    if (admin?.role === 'university_admin') return admin.universityId ?? '';
    return '';
  }, [admin]);

  const effectiveUniversityId = useMemo(() => {
    if (scopeUniversityId) return scopeUniversityId;
    return selectedUniversityId;
  }, [scopeUniversityId, selectedUniversityId]);

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
    const base = collection(db, 'modules');
    const q = effectiveUniversityId ? query(base, where('universityId', '==', effectiveUniversityId)) : query(base);
    const unsub = onSnapshot(q, (snap) => {
      const next: ModRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as ModuleRecord) }));
      next.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));
      setRows(next);
    });
    return () => unsub();
  }, [effectiveUniversityId]);

  const canWrite = !!admin;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Modules</div>
          <div className="muted">Catalog of modules students can add</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <div style={{ fontWeight: 800 }}>Filter</div>
            <select
              className="select"
              style={{ width: 320 }}
              value={effectiveUniversityId}
              disabled={!!scopeUniversityId}
              onChange={(e) => setSelectedUniversityId(e.target.value)}
            >
              <option value="">All universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
          <button className="button secondary" disabled={!canWrite} onClick={() => setCreating((v) => !v)}>
            {creating ? 'Close' : 'New'}
          </button>
        </div>

        {creating ? (
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              if (!canWrite) return;
              setError(null);
              try {
                const uniId = effectiveUniversityId || selectedUniversityId;
                const rec: ModuleRecord = {
                  name: name.trim(),
                  code: code.trim().toUpperCase(),
                  universityId: uniId,
                  course: course.trim() || undefined,
                  isFeatured: false,
                };
                if (!rec.name || !rec.code || !rec.universityId) {
                  setError('Name, code, and university are required');
                  return;
                }
                await addDoc(collection(db, 'modules'), { ...rec, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                setName('');
                setCode('');
                setCourse('');
                setCreating(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Create failed');
              }
            }}
            style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 220px', gap: 10 }}
          >
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Module name
              </div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Module code
              </div>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                University
              </div>
              <select
                className="select"
                value={effectiveUniversityId}
                disabled={!!scopeUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
              >
                <option value="">Select</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Course/Degree (optional)
              </div>
              <input className="input" value={course} onChange={(e) => setCourse(e.target.value)} />
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
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Modules</div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>University</th>
              <th>Featured</th>
              <th style={{ width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <ModuleRow
                key={m.id}
                row={m}
                universities={universities}
                canEditUniversity={!scopeUniversityId && admin?.role === 'superadmin'}
                canWrite={canWrite}
              />
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No modules found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleRow({
  row,
  universities,
  canWrite,
  canEditUniversity,
}: {
  row: ModRow;
  universities: UniRow[];
  canWrite: boolean;
  canEditUniversity: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [universityId, setUniversityId] = useState(row.universityId);
  const [isFeatured, setIsFeatured] = useState(!!row.isFeatured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const universityLabel = useMemo(() => {
    const uni = universities.find((u) => u.id === row.universityId);
    return uni ? `${uni.name} (${uni.code})` : row.universityId;
  }, [universities, row.universityId]);

  return (
    <tr>
      <td style={{ width: 140 }}>{editing ? <input className="input" value={code} onChange={(e) => setCode(e.target.value)} /> : row.code}</td>
      <td>{editing ? <input className="input" value={name} onChange={(e) => setName(e.target.value)} /> : row.name}</td>
      <td style={{ width: 300 }}>
        {editing ? (
          <select
            className="select"
            value={universityId}
            disabled={!canEditUniversity}
            onChange={(e) => setUniversityId(e.target.value)}
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">{universityLabel}</span>
        )}
      </td>
      <td style={{ width: 120 }}>
        {editing ? (
          <select className="select" value={isFeatured ? 'yes' : 'no'} onChange={(e) => setIsFeatured(e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        ) : row.isFeatured ? (
          <span className="pill ok">Featured</span>
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
                    await updateDoc(doc(db, 'modules', row.id), {
                      name: name.trim(),
                      code: code.trim().toUpperCase(),
                      universityId,
                      isFeatured,
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
                  setUniversityId(row.universityId);
                  setIsFeatured(!!row.isFeatured);
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
                  if (!confirm(`Delete module "${row.code}"?`)) return;
                  await deleteDoc(doc(db, 'modules', row.id));
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
