import {
  addDoc,
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
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db, storage } from '../firebase';
import { Assessment, AssessmentType, ModuleRecord, University } from '../types';
import { detectFileKind, extractMetadataFromFilename, sha256Hex } from '../utils/files';
import { BulkUploadPanel } from './BulkUploadPanel';

type UniRow = { id: string } & University;
type ModRow = { id: string } & ModuleRecord;
type AssessRow = { id: string } & Assessment;

type Tab = 'create' | 'memo' | 'bulk' | 'list';

export function AssessmentsPage() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<Tab>('create');
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [modules, setModules] = useState<ModRow[]>([]);
  const [assessments, setAssessments] = useState<AssessRow[]>([]);

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
    const base = collection(db, 'modules');
    const q = scopeUniversityId ? query(base, where('universityId', '==', scopeUniversityId)) : query(base);
    const unsub = onSnapshot(q, (snap) => {
      const next: ModRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as ModuleRecord) }));
      next.sort((a, b) => a.code.localeCompare(b.code));
      setModules(next);
    });
    return () => unsub();
  }, [scopeUniversityId]);

  useEffect(() => {
    const base = collection(db, 'assessments');
    const q = scopeUniversityId
      ? query(base, where('universityId', '==', scopeUniversityId), orderBy('createdAt', 'desc'), limit(50))
      : query(base, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const next: AssessRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as Assessment) }));
      setAssessments(next);
    });
    return () => unsub();
  }, [scopeUniversityId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">Assessments</div>
          <div className="muted">Create practice/tests/exams, attach memos, and bulk ingest question papers</div>
        </div>
        <div className="row">
          <button className={tab === 'create' ? 'button primary' : 'button secondary'} onClick={() => setTab('create')}>
            Create
          </button>
          <button className={tab === 'memo' ? 'button primary' : 'button secondary'} onClick={() => setTab('memo')}>
            Memo
          </button>
          <button className={tab === 'bulk' ? 'button primary' : 'button secondary'} onClick={() => setTab('bulk')}>
            Bulk Upload
          </button>
          <button className={tab === 'list' ? 'button primary' : 'button secondary'} onClick={() => setTab('list')}>
            Recent
          </button>
        </div>
      </div>

      {tab === 'create' ? (
        <CreateAssessmentPanel universities={universities} modules={modules} scopeUniversityId={scopeUniversityId} />
      ) : null}
      {tab === 'memo' ? <AttachMemoPanel assessments={assessments} /> : null}
      {tab === 'bulk' ? <BulkUploadPanel universities={universities} modules={modules} scopeUniversityId={scopeUniversityId} /> : null}
      {tab === 'list' ? <AssessmentsListPanel assessments={assessments} modules={modules} universities={universities} /> : null}
    </div>
  );
}

function AssessmentsListPanel({
  assessments,
  modules,
  universities,
}: {
  assessments: AssessRow[];
  modules: ModRow[];
  universities: UniRow[];
}) {
  const moduleByCode = useMemo(() => {
    const map = new Map<string, ModRow>();
    for (const m of modules) map.set(m.code, m);
    return map;
  }, [modules]);

  const uniById = useMemo(() => {
    const map = new Map<string, UniRow>();
    for (const u of universities) map.set(u.id, u);
    return map;
  }, [universities]);

  return (
    <div className="panel">
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Recent assessments (latest 50)</div>
      <table className="table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Type</th>
            <th>Year</th>
            <th>Title</th>
            <th>Paper</th>
            <th>Memo</th>
            <th>University</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((a) => {
            const m = moduleByCode.get(a.moduleId);
            const uni = a.universityId ? uniById.get(a.universityId) : undefined;
            return (
              <tr key={a.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{a.moduleId}</div>
                  <div className="muted">{m?.name ?? ''}</div>
                </td>
                <td>
                  <span className="pill">{a.type}</span>
                </td>
                <td>{a.year}</td>
                <td>{a.title}</td>
                <td>
                  {a.questionPaperUrl ? (
                    <a className="button secondary" href={a.questionPaperUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {a.memoUrl ? (
                    <a className="button secondary" href={a.memoUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="muted">{uni ? `${uni.name} (${uni.code})` : a.universityId ?? '—'}</td>
              </tr>
            );
          })}
          {assessments.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">
                No assessments found
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function CreateAssessmentPanel({
  universities,
  modules,
  scopeUniversityId,
}: {
  universities: UniRow[];
  modules: ModRow[];
  scopeUniversityId: string;
}) {
  const [universityId, setUniversityId] = useState(scopeUniversityId);
  const [moduleCode, setModuleCode] = useState('');
  const [type, setType] = useState<AssessmentType>('test');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);

  useEffect(() => {
    if (scopeUniversityId) setUniversityId(scopeUniversityId);
  }, [scopeUniversityId]);

  useEffect(() => {
    if (!file) return;
    const meta = extractMetadataFromFilename(file.name);
    if (meta.moduleCode && !moduleCode) setModuleCode(meta.moduleCode);
    if (meta.year && !year) setYear(meta.year);
    if (meta.type) setType(meta.type);
    if (meta.title && !title) setTitle(meta.title);
  }, [file, moduleCode, title, year]);

  async function validateFile(f: File) {
    const kind = await detectFileKind(f);
    if (kind.kind === 'unknown') return { ok: false, reason: kind.reason ?? 'Unsupported file' };
    if (f.size > 250 * 1024 * 1024) return { ok: false, reason: 'File too large (max 250MB)' };
    return { ok: true };
  }

  async function uploadToStorage(assessmentId: string, f: File) {
    const safe = f.name.replace(/[^\w.\-]+/g, '_');
    const path = `assessments/${universityId}/${moduleCode}/${type}/${year}/${assessmentId}/questionPaper_${Date.now()}_${safe}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, f, { contentType: f.type || undefined });
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

  async function checkDuplicate(hash: string) {
    const q = query(collection(db, 'assessments'), where('sha256', '==', hash), limit(5));
    return await new Promise<string[]>((resolve) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          const ids: string[] = [];
          snap.forEach((d) => ids.push(d.id));
          resolve(ids);
          unsub();
        },
        () => resolve([]),
      );
    });
  }

  return (
    <div className="panel">
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Create assessment</div>
      <form
        onSubmit={async (e: FormEvent) => {
          e.preventDefault();
          setError(null);
          setDuplicateIds([]);
          if (!universityId || !moduleCode || !title || !year) {
            setError('University, module, title, and year are required');
            return;
          }
          if (type === 'practice' && !topic.trim()) {
            setError('Topic is required for practice assessments');
            return;
          }

          setCreating(true);
          try {
            let sha: string | undefined;
            if (file) {
              const v = await validateFile(file);
              if (!v.ok) {
                setError(v.reason ?? 'Invalid file');
                setCreating(false);
                return;
              }
              sha = await sha256Hex(file);
              const dup = await checkDuplicate(sha);
              if (dup.length) setDuplicateIds(dup);
            }

            const rec: Assessment = {
              universityId,
              moduleId: moduleCode.trim().toUpperCase(),
              type,
              topic: type === 'practice' ? topic.trim() : undefined,
              year: Number(year),
              title: title.trim(),
              createdAt: serverTimestamp(),
              sha256: sha,
            };
            const docRef = await addDoc(collection(db, 'assessments'), rec);

            if (file) {
              const uploaded = await uploadToStorage(docRef.id, file);
              await updateDoc(docRef, {
                questionPaperUrl: uploaded.url,
                questionPaperPath: uploaded.path,
                updatedAt: serverTimestamp(),
              });
            }

            setTitle('');
            setTopic('');
            setFile(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Create failed');
          } finally {
            setCreating(false);
          }
        }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
      >
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            University
          </div>
          <select
            className="select"
            value={universityId}
            disabled={!!scopeUniversityId}
            onChange={(e) => setUniversityId(e.target.value)}
          >
            <option value="">Select</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Module
          </div>
          <select className="select" value={moduleCode} onChange={(e) => setModuleCode(e.target.value)}>
            <option value="">Select</option>
            {modules
              .filter((m) => (universityId ? m.universityId === universityId : true))
              .map((m) => (
                <option key={m.id} value={m.code}>
                  {m.code} — {m.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Type
          </div>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as AssessmentType)}>
            <option value="practice">practice</option>
            <option value="test">test</option>
            <option value="exam">exam</option>
            <option value="supplementary">supplementary</option>
          </select>
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Year
          </div>
          <input className="input" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Title
          </div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {type === 'practice' ? (
          <div style={{ gridColumn: '1 / span 2' }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              Topic
            </div>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        ) : null}
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Question paper (PDF/DOC/DOCX/images)
          </div>
          <input
            className="input"
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="muted" style={{ marginTop: 6 }}>
            Duplicate detection computes a SHA-256 hash client-side before upload.
          </div>
        </div>

        {duplicateIds.length ? (
          <div className="pill warn" style={{ gridColumn: '1 / span 2' }}>
            Possible duplicate: {duplicateIds.join(', ')}
          </div>
        ) : null}

        {error ? (
          <div className="pill danger" style={{ gridColumn: '1 / span 2' }}>
            {error}
          </div>
        ) : null}
        <div className="row" style={{ gridColumn: '1 / span 2', justifyContent: 'flex-end' }}>
          <button className="button primary" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AttachMemoPanel({ assessments }: { assessments: AssessRow[] }) {
  const [assessmentId, setAssessmentId] = useState('');
  const [memoFile, setMemoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadMemo(a: AssessRow, f: File) {
    const safe = f.name.replace(/[^\w.\-]+/g, '_');
    const path = `assessments/${a.universityId}/${a.moduleId}/${a.type}/${a.year}/${a.id}/memo_${Date.now()}_${safe}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, f, { contentType: f.type || undefined });
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
    <div className="panel">
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Attach memo / solutions</div>
      <form
        onSubmit={async (e: FormEvent) => {
          e.preventDefault();
          setError(null);
          const a = assessments.find((x) => x.id === assessmentId);
          if (!a) {
            setError('Select an assessment');
            return;
          }
          if (!memoFile && !videoUrl.trim()) {
            setError('Provide a memo file or video URL');
            return;
          }
          setSaving(true);
          try {
            const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
            if (memoFile) {
              const kind = await detectFileKind(memoFile);
              if (kind.kind !== 'pdf' && kind.kind !== 'doc' && kind.kind !== 'docx') {
                setError('Memo must be PDF/DOC/DOCX');
                setSaving(false);
                return;
              }
              const uploaded = await uploadMemo(a, memoFile);
              patch.memoUrl = uploaded.url;
              patch.memoPath = uploaded.path;
            }
            if (videoUrl.trim()) patch.videoSolutionUrl = videoUrl.trim();
            await updateDoc(doc(db, 'assessments', a.id), patch);
            setMemoFile(null);
            setVideoUrl('');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
          } finally {
            setSaving(false);
          }
        }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
      >
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Assessment
          </div>
          <select className="select" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
            <option value="">Select</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.moduleId} • {a.type} • {a.year} • {a.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Memo file (PDF/DOC/DOCX)
          </div>
          <input className="input" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setMemoFile(e.target.files?.[0] ?? null)} />
        </div>
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Video solution URL (optional)
          </div>
          <input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </div>
        {error ? (
          <div className="pill danger" style={{ gridColumn: '1 / span 2' }}>
            {error}
          </div>
        ) : null}
        <div className="row" style={{ gridColumn: '1 / span 2', justifyContent: 'flex-end' }}>
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

