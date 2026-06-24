import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth';
import { db, storage } from '../firebase';
import { Assessment, AssessmentType, ModuleRecord, University, UploadBatchItem, UploadBatchStatus } from '../types';
import { detectFileKind, extractMetadataFromFilename, sha256Hex } from '../utils/files';

type UniRow = { id: string } & University;
type ModRow = { id: string } & ModuleRecord;

type ItemState = {
  localId: string;
  itemDocId?: string;
  file: File;
  sha256?: string;
  status: UploadBatchItem['status'];
  error?: string;
  progress: number;
  universityId: string;
  moduleCode: string;
  type: AssessmentType;
  year: number;
  topic?: string;
  title: string;
  assessmentId?: string;
  storagePath?: string;
  downloadUrl?: string;
  duplicateAssessmentIds?: string[];
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function BulkUploadPanel({
  universities,
  modules,
  scopeUniversityId,
}: {
  universities: UniRow[];
  modules: ModRow[];
  scopeUniversityId: string;
}) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<ItemState[]>([]);
  const [defaultsUniversityId, setDefaultsUniversityId] = useState(scopeUniversityId);
  const [defaultsModuleCode, setDefaultsModuleCode] = useState('');
  const [defaultsType, setDefaultsType] = useState<AssessmentType>('test');
  const [defaultsYear, setDefaultsYear] = useState<number>(new Date().getFullYear());
  const [defaultsTopic, setDefaultsTopic] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [concurrency, setConcurrency] = useState(3);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<UploadBatchStatus | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (scopeUniversityId) setDefaultsUniversityId(scopeUniversityId);
  }, [scopeUniversityId]);

  useEffect(() => {
    if (!batchId) return;
    const bRef = doc(db, 'admin_upload_batches', batchId);
    const unsub = onSnapshot(
      bRef,
      (snap) => {
        const s = snap.data() as { status?: UploadBatchStatus } | undefined;
        if (s?.status) setBatchStatus(s.status);
      },
      () => {},
    );
    return () => unsub();
  }, [batchId]);

  const scopedModules = useMemo(() => {
    return modules.filter((m) => (defaultsUniversityId ? m.universityId === defaultsUniversityId : true));
  }, [modules, defaultsUniversityId]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: ItemState[] = [];
    for (const f of Array.from(fileList)) {
      const meta = extractMetadataFromFilename(f.name);
      const moduleCode = (meta.moduleCode ?? defaultsModuleCode).toUpperCase();
      const year = meta.year ?? defaultsYear;
      const type = meta.type ?? defaultsType;
      const title = meta.title ?? f.name.replace(/\.[^/.]+$/, '');
      next.push({
        localId: uid(),
        file: f,
        status: 'queued',
        progress: 0,
        universityId: defaultsUniversityId,
        moduleCode,
        type,
        year,
        topic: type === 'practice' ? defaultsTopic || meta.topic : undefined,
        title,
      });
    }
    setItems((prev) => [...prev, ...next]);
  }

  function updateItem(localId: string, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  }

  async function ensureBatch() {
    if (batchId) return batchId;
    if (!user) throw new Error('Not signed in');
    const refDoc = await addDoc(collection(db, 'admin_upload_batches'), {
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      status: 'running' satisfies UploadBatchStatus,
      totalFiles: items.length,
      completedFiles: 0,
      failedFiles: 0,
    });
    setBatchId(refDoc.id);
    setBatchStatus('running');
    return refDoc.id;
  }

  async function createItemDoc(bId: string, item: ItemState) {
    const docRef = await addDoc(collection(db, 'admin_upload_batches', bId, 'items'), {
      fileName: item.file.name,
      mimeType: item.file.type || undefined,
      size: item.file.size,
      status: item.status,
      metadata: {
        universityId: item.universityId,
        moduleCode: item.moduleCode,
        type: item.type,
        year: item.year,
        topic: item.topic ?? undefined,
        title: item.title,
      },
      startedAt: null,
      finishedAt: null,
      createdAt: serverTimestamp(),
    } satisfies Partial<UploadBatchItem> as any);
    return docRef.id;
  }

  async function uploadFileToStorage(assessmentId: string, item: ItemState, onProgress: (p: number) => void) {
    const safe = item.file.name.replace(/[^\w.\-]+/g, '_');
    const path = `assessments/${item.universityId}/${item.moduleCode}/${item.type}/${item.year}/${assessmentId}/bulk_${Date.now()}_${safe}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, item.file, { contentType: item.file.type || undefined });
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => {
          const p = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0;
          onProgress(p);
        },
        (e) => reject(e),
        () => resolve(),
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    return { url, path };
  }

  async function findDuplicates(sha: string) {
    const q = query(collection(db, 'assessments'), where('sha256', '==', sha));
    return await new Promise<string[]>((resolve) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          const ids: string[] = [];
          snap.forEach((d) => ids.push(d.id));
          resolve(ids.slice(0, 5));
          unsub();
        },
        () => resolve([]),
      );
    });
  }

  async function processItem(bId: string, item: ItemState) {
    updateItem(item.localId, { status: 'uploading', error: undefined, progress: 0 });
    const itemDocId = item.itemDocId ?? (await createItemDoc(bId, item));
    updateItem(item.localId, { itemDocId });
    const itemRef = doc(db, 'admin_upload_batches', bId, 'items', itemDocId);

    await updateDoc(itemRef, { status: 'uploading', startedAt: serverTimestamp() });

    try {
      const kind = await detectFileKind(item.file);
      if (kind.kind === 'unknown') throw new Error(kind.reason ?? 'Unsupported format');
      const sha = await sha256Hex(item.file);
      updateItem(item.localId, { sha256: sha });
      await updateDoc(itemRef, { sha256: sha });

      const dup = await findDuplicates(sha);
      if (dup.length && !allowDuplicates) {
        updateItem(item.localId, { status: 'failed', error: `Duplicate detected (${dup.join(', ')})`, duplicateAssessmentIds: dup });
        await updateDoc(itemRef, { status: 'failed', error: `Duplicate detected (${dup.join(', ')})`, finishedAt: serverTimestamp() });
        await updateDoc(doc(db, 'admin_upload_batches', bId), { failedFiles: increment(1) });
        return;
      }

      updateItem(item.localId, { duplicateAssessmentIds: dup.length ? dup : undefined });

      const assessment: Assessment = {
        universityId: item.universityId,
        moduleId: item.moduleCode.toUpperCase(),
        type: item.type,
        year: item.year,
        title: item.title,
        topic: item.type === 'practice' ? item.topic?.trim() || undefined : undefined,
        createdAt: serverTimestamp(),
        sha256: sha,
      };

      const assessRef = await addDoc(collection(db, 'assessments'), assessment);
      updateItem(item.localId, { assessmentId: assessRef.id });
      await updateDoc(itemRef, { assessmentId: assessRef.id });

      const uploaded = await uploadFileToStorage(assessRef.id, item, (p) => updateItem(item.localId, { progress: p }));
      updateItem(item.localId, { storagePath: uploaded.path, downloadUrl: uploaded.url, progress: 1 });

      await updateDoc(assessRef, {
        questionPaperUrl: uploaded.url,
        questionPaperPath: uploaded.path,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(itemRef, {
        status: 'completed',
        storagePath: uploaded.path,
        downloadUrl: uploaded.url,
        finishedAt: serverTimestamp(),
      });
      updateItem(item.localId, { status: 'completed' });
      await updateDoc(doc(db, 'admin_upload_batches', bId), { completedFiles: increment(1) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      updateItem(item.localId, { status: 'failed', error: msg });
      await updateDoc(itemRef, { status: 'failed', error: msg, finishedAt: serverTimestamp() });
      await updateDoc(doc(db, 'admin_upload_batches', bId), { failedFiles: increment(1) });
    }
  }

  async function runQueue(bId: string) {
    if (runningRef.current) return;
    runningRef.current = true;
    setBatchError(null);

    const queue = items.filter((i) => i.status === 'queued');
    let idx = 0;

    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, 6)) }).map(async () => {
      while (idx < queue.length) {
        const current = queue[idx++];
        await processItem(bId, current);
      }
    });

    try {
      await Promise.all(workers);
      const remaining = items.some((i) => i.status === 'queued' || i.status === 'uploading');
      if (!remaining) await updateDoc(doc(db, 'admin_upload_batches', bId), { status: 'completed' satisfies UploadBatchStatus, finishedAt: serverTimestamp() });
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Batch failed');
      await updateDoc(doc(db, 'admin_upload_batches', bId), { status: 'failed' satisfies UploadBatchStatus, finishedAt: serverTimestamp() });
    } finally {
      runningRef.current = false;
    }
  }

  async function rollbackBatch() {
    if (!batchId) return;
    const bId = batchId;
    const completed = items.filter((i) => i.status === 'completed');
    for (const i of completed) {
      try {
        if (i.storagePath) await deleteObject(ref(storage, i.storagePath));
        if (i.assessmentId) await updateDoc(doc(db, 'assessments', i.assessmentId), { rolledBackAt: serverTimestamp(), status: 'rolled_back' });
        if (i.itemDocId) await updateDoc(doc(db, 'admin_upload_batches', bId, 'items', i.itemDocId), { status: 'rolled_back', finishedAt: serverTimestamp() });
        updateItem(i.localId, { status: 'rolled_back' });
      } catch (err) {
        updateItem(i.localId, { error: err instanceof Error ? err.message : 'Rollback failed' });
      }
    }
    await updateDoc(doc(db, 'admin_upload_batches', bId), { status: 'rolled_back' satisfies UploadBatchStatus, rolledBackAt: serverTimestamp() });
    setBatchStatus('rolled_back');
  }

  const totalBytes = useMemo(() => items.reduce((s, i) => s + (i.file.size || 0), 0), [items]);
  const uploadedBytes = useMemo(
    () => items.reduce((s, i) => s + Math.round((i.file.size || 0) * (i.progress || 0)), 0),
    [items],
  );
  const overallProgress = totalBytes ? uploadedBytes / totalBytes : 0;

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800 }}>Bulk upload pipeline</div>
          <div className="muted">Drag-and-drop, validation, metadata extraction, duplicate detection, batch logs, rollback</div>
        </div>
        <div className="row">
          {batchId ? <span className="pill">Batch: {batchId}</span> : null}
          {batchStatus ? (
            <span className={batchStatus === 'completed' ? 'pill ok' : batchStatus === 'failed' ? 'pill danger' : 'pill'}>
              {batchStatus}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 12 }}>
        <div className="panel" style={{ background: 'rgba(16,29,55,0.35)' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Defaults</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                University
              </div>
              <select
                className="select"
                value={defaultsUniversityId}
                disabled={!!scopeUniversityId || active}
                onChange={(e) => setDefaultsUniversityId(e.target.value)}
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
              <select
                className="select"
                value={defaultsModuleCode}
                disabled={active}
                onChange={(e) => setDefaultsModuleCode(e.target.value)}
              >
                <option value="">Select</option>
                {scopedModules.map((m) => (
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
              <select className="select" value={defaultsType} disabled={active} onChange={(e) => setDefaultsType(e.target.value as AssessmentType)}>
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
              <input className="input" value={String(defaultsYear)} disabled={active} onChange={(e) => setDefaultsYear(Number(e.target.value))} />
            </div>
            {defaultsType === 'practice' ? (
              <div style={{ gridColumn: '1 / span 2' }}>
                <div className="muted" style={{ marginBottom: 6 }}>
                  Topic (applies to practice)
                </div>
                <input className="input" value={defaultsTopic} disabled={active} onChange={(e) => setDefaultsTopic(e.target.value)} />
              </div>
            ) : null}
          </div>
          <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <label className="row" style={{ gap: 8 }}>
              <input type="checkbox" checked={allowDuplicates} disabled={active} onChange={(e) => setAllowDuplicates(e.target.checked)} />
              <span className="muted">Allow duplicates</span>
            </label>
            <div className="row">
              <span className="muted">Concurrency</span>
              <input
                className="input"
                style={{ width: 80 }}
                type="number"
                min={1}
                max={6}
                disabled={active}
                value={String(concurrency)}
                onChange={(e) => setConcurrency(Math.max(1, Math.min(6, Number(e.target.value))))}
              />
            </div>
          </div>
        </div>

        <div
          className={dragOver ? 'dropzone dropzoneActive' : 'dropzone'}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <div style={{ fontWeight: 800 }}>Drag and drop files here</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Supported: PDF, DOC, DOCX, images. Each file is validated and hashed for duplicates.
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="input"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              multiple
              disabled={active}
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <div className="muted">{items.length} files queued</div>
            <button
              className="button danger"
              disabled={active || items.length === 0}
              onClick={() => {
                if (!confirm('Clear queued files?')) return;
                setItems([]);
                setBatchId(null);
                setBatchStatus(null);
                setBatchError(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ background: 'rgba(16,29,55,0.35)', marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Progress</div>
            <div className="muted">
              {Math.round(overallProgress * 100)}% • {Math.round(uploadedBytes / (1024 * 1024))}MB / {Math.round(totalBytes / (1024 * 1024))}MB
            </div>
          </div>
          <div className="row">
            <button
              className="button primary"
              disabled={active || items.length === 0 || !defaultsUniversityId}
              onClick={async () => {
                setActive(true);
                try {
                  const bId = await ensureBatch();
                  await updateDoc(doc(db, 'admin_upload_batches', bId), { totalFiles: items.length });
                  await runQueue(bId);
                } finally {
                  setActive(false);
                }
              }}
            >
              Start batch
            </button>
            <button className="button danger" disabled={!batchId || active} onClick={rollbackBatch}>
              Rollback batch
            </button>
          </div>
        </div>
        <div className="progressBar" style={{ marginTop: 10 }}>
          <div className="progressFill" style={{ width: `${Math.round(overallProgress * 100)}%` }} />
        </div>
        {batchError ? (
          <div className="pill danger" style={{ marginTop: 10 }}>
            {batchError}
          </div>
        ) : null}
      </div>

      <div className="panel">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Queue</div>
        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Module</th>
              <th>Type</th>
              <th>Year</th>
              <th>Title</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.localId}>
                <td>
                  <div style={{ fontWeight: 700 }}>{i.file.name}</div>
                  <div className="muted">
                    {Math.round(i.file.size / 1024)}KB {i.duplicateAssessmentIds?.length ? `• dup: ${i.duplicateAssessmentIds.join(', ')}` : ''}
                  </div>
                </td>
                <td style={{ width: 140 }}>
                  <input
                    className="input"
                    value={i.moduleCode}
                    disabled={active}
                    onChange={(e) => updateItem(i.localId, { moduleCode: e.target.value.toUpperCase() })}
                  />
                </td>
                <td style={{ width: 160 }}>
                  <select className="select" value={i.type} disabled={active} onChange={(e) => updateItem(i.localId, { type: e.target.value as AssessmentType })}>
                    <option value="practice">practice</option>
                    <option value="test">test</option>
                    <option value="exam">exam</option>
                    <option value="supplementary">supplementary</option>
                  </select>
                </td>
                <td style={{ width: 120 }}>
                  <input className="input" value={String(i.year)} disabled={active} onChange={(e) => updateItem(i.localId, { year: Number(e.target.value) })} />
                </td>
                <td>
                  <input className="input" value={i.title} disabled={active} onChange={(e) => updateItem(i.localId, { title: e.target.value })} />
                </td>
                <td style={{ width: 140 }}>
                  <span
                    className={
                      i.status === 'completed'
                        ? 'pill ok'
                        : i.status === 'failed'
                          ? 'pill danger'
                          : i.status === 'uploading'
                            ? 'pill warn'
                            : 'pill'
                    }
                  >
                    {i.status}
                  </span>
                  {i.error ? (
                    <div className="muted" style={{ marginTop: 6 }}>
                      {i.error}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div className="progressBar">
                    <div className="progressFill" style={{ width: `${Math.round((i.progress || 0) * 100)}%` }} />
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {Math.round((i.progress || 0) * 100)}%
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  Drop files to begin
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

