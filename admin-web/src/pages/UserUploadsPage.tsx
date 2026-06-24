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
  addDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { db, storage } from '../firebase';
import { Assessment, AssessmentType, ModuleRecord, University, UserUpload } from '../types';

type UploadRow = { id: string } & UserUpload;

function mapPaperType(paperType: string): AssessmentType | null {
  const v = (paperType || '').toLowerCase();
  if (v.includes('practice') || v === 'prac') return 'practice';
  if (v.includes('exam')) return 'exam';
  if (v.includes('test')) return 'test';
  if (v.includes('supp')) return 'supplementary';
  return null;
}

export function UserUploadsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'error'>('pending');
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [universities, setUniversities] = useState<Array<{ id: string } & University>>([]);
  const [modules, setModules] = useState<Array<{ id: string } & ModuleRecord>>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'user_uploads'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      const next: UploadRow[] = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as UserUpload) }));
      setRows(next);
      if (next.length && !selectedId) setSelectedId(next[0].id);
    });
    return () => unsub();
  }, [status, selectedId]);

  useEffect(() => {
    const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: Array<{ id: string } & University> = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as University) }));
      setUniversities(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'modules'), orderBy('code', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: Array<{ id: string } & ModuleRecord> = [];
      snap.forEach((d) => next.push({ id: d.id, ...(d.data() as ModuleRecord) }));
      setModules(next);
    });
    return () => unsub();
  }, []);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">User Uploads</div>
          <div className="muted">Moderate submissions created by the mobile Upload screen</div>
        </div>
        <div className="row">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="error">error</option>
          </select>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Latest 50</div>
          <table className="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Year</th>
                <th>Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(r.id)}>
                  <td style={{ fontWeight: r.id === selectedId ? 800 : 600 }}>{r.moduleCode}</td>
                  <td>{r.year}</td>
                  <td>{r.title}</td>
                  <td>
                    <span className={r.status === 'pending' ? 'pill warn' : r.status === 'approved' ? 'pill ok' : 'pill'}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No uploads found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Review</div>
          {selected ? (
            <ReviewPanel upload={selected} reviewerUid={user?.uid ?? ''} universities={universities} modules={modules} />
          ) : (
            <div className="muted">Select an upload</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({
  upload,
  reviewerUid,
  universities,
  modules,
}: {
  upload: UploadRow;
  reviewerUid: string;
  universities: Array<{ id: string } & University>;
  modules: Array<{ id: string } & ModuleRecord>;
}) {
  const [type, setType] = useState<AssessmentType>(() => mapPaperType(upload.paperType) ?? 'test');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState(upload.title);
  const [universityId, setUniversityId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setType(mapPaperType(upload.paperType) ?? 'test');
    setTitle(upload.title);
    setTopic('');
    const m = modules.find((x) => x.code?.toUpperCase() === upload.moduleCode?.toUpperCase());
    setUniversityId(m?.universityId ?? '');
    setNotes('');
    setError(null);
  }, [upload.id, modules, upload.moduleCode, upload.paperType, upload.title]);

  async function fetchAsFile(downloadUrl: string, fileName: string, mimeType?: string) {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Failed to download (${res.status})`);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType || blob.type || 'application/octet-stream' });
  }

  async function uploadToAssessments(assessmentId: string, f: File) {
    const safe = f.name.replace(/[^\w.\-]+/g, '_');
    const path = `assessments/${universityId}/${upload.moduleCode}/${type}/${upload.year}/${assessmentId}/promoted_${Date.now()}_${safe}`;
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

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      if (!universityId) {
        setError('Select a university');
        setBusy(false);
        return;
      }
      const file = await fetchAsFile(upload.downloadUrl, upload.fileName, upload.mimeType);
      const assessment: Assessment = {
        universityId,
        moduleId: upload.moduleCode.toUpperCase(),
        type,
        year: upload.year,
        title: title.trim() || upload.title,
        topic: type === 'practice' ? topic.trim() || undefined : undefined,
        createdAt: serverTimestamp(),
      };
      const aRef = await addDoc(collection(db, 'assessments'), assessment);
      const promoted = await uploadToAssessments(aRef.id, file);
      await updateDoc(aRef, { questionPaperUrl: promoted.url, questionPaperPath: promoted.path, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'user_uploads', upload.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerUid || null,
        reviewNotes: notes.trim() || null,
        assessmentId: aRef.id,
        promotedPath: promoted.path,
        promotedUrl: promoted.url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
      await updateDoc(doc(db, 'user_uploads', upload.id), { status: 'error', reviewNotes: String(err), reviewedAt: serverTimestamp() });
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'user_uploads', upload.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerUid || null,
        reviewNotes: notes.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="pill warn">{upload.status}</span>
        <a className="button secondary" href={upload.downloadUrl} target="_blank" rel="noreferrer">
          Download
        </a>
      </div>

      <div className="grid2">
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Module
          </div>
          <div style={{ fontWeight: 800 }}>{upload.moduleCode}</div>
          <div className="muted">{upload.paperType}</div>
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Year
          </div>
          <div style={{ fontWeight: 800 }}>{upload.year}</div>
          <div className="muted">{upload.email ?? upload.uid}</div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            University
          </div>
          <select className="select" value={universityId} disabled={busy} onChange={(e) => setUniversityId(e.target.value)}>
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
            Map to type
          </div>
          <select className="select" value={type} disabled={busy} onChange={(e) => setType(e.target.value as AssessmentType)}>
            <option value="practice">practice</option>
            <option value="test">test</option>
            <option value="exam">exam</option>
            <option value="supplementary">supplementary</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Title
          </div>
          <input className="input" value={title} disabled={busy} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      {type === 'practice' ? (
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Topic (required for practice)
          </div>
          <input className="input" value={topic} disabled={busy} onChange={(e) => setTopic(e.target.value)} />
        </div>
      ) : null}

      <div>
        <div className="muted" style={{ marginBottom: 6 }}>
          Notes
        </div>
        <textarea className="textarea" value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error ? <div className="pill danger">{error}</div> : null}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="button danger" disabled={busy} onClick={reject}>
          Reject
        </button>
        <button className="button primary" disabled={busy} onClick={approve}>
          Approve + promote
        </button>
      </div>
      <div className="muted">
        Promote downloads the user-uploaded file and re-uploads it into the assessments storage area so students can access it.
      </div>
    </div>
  );
}
