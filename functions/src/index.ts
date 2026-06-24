import * as crypto from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

async function requireAdmin(uid: string) {
  const snap = await db.doc(`admins/${uid}`).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Not an admin');
  const data = snap.data() as { role?: string; universityId?: string } | undefined;
  return { role: data?.role ?? 'university_admin', universityId: data?.universityId ?? null };
}

function buildDownloadUrl(bucketName: string, objectPath: string, token: string) {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

export const promoteUserUpload = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  await requireAdmin(uid);

  const userUploadId = String((request.data as any)?.userUploadId ?? '');
  const assessmentInput = (request.data as any)?.assessment ?? null;

  if (!userUploadId) throw new HttpsError('invalid-argument', 'userUploadId is required');
  if (!assessmentInput) throw new HttpsError('invalid-argument', 'assessment is required');

  const universityId = String(assessmentInput.universityId ?? '');
  const moduleId = String(assessmentInput.moduleId ?? '').toUpperCase();
  const type = String(assessmentInput.type ?? '');
  const year = Number(assessmentInput.year ?? NaN);
  const title = String(assessmentInput.title ?? '');
  const topic = String(assessmentInput.topic ?? '');

  if (!universityId || !moduleId || !type || !Number.isFinite(year) || !title) {
    throw new HttpsError('invalid-argument', 'assessment fields invalid');
  }

  const uploadRef = db.doc(`user_uploads/${userUploadId}`);
  const uploadSnap = await uploadRef.get();
  if (!uploadSnap.exists) throw new HttpsError('not-found', 'user_uploads doc not found');
  const upload = uploadSnap.data() as any;

  if (upload.status !== 'pending') throw new HttpsError('failed-precondition', 'Upload not pending');
  if (!upload.storagePath || !upload.fileName) throw new HttpsError('failed-precondition', 'Upload missing storagePath/fileName');

  const assessmentsRef = db.collection('assessments').doc();
  const assessmentId = assessmentsRef.id;

  const safeName = String(upload.fileName).replace(/[^\w.\-]+/g, '_');
  const destPath = `assessments/${universityId}/${moduleId}/${type}/${year}/${assessmentId}/promoted_${Date.now()}_${safeName}`;

  const srcFile = bucket.file(String(upload.storagePath));
  const destFile = bucket.file(destPath);

  const token = crypto.randomUUID();
  await srcFile.copy(destFile);
  await destFile.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
    contentType: upload.mimeType || undefined,
  });

  const downloadUrl = buildDownloadUrl(bucket.name, destPath, token);

  await db.runTransaction(async (tx) => {
    tx.set(assessmentsRef, {
      universityId,
      moduleId,
      type,
      year,
      title,
      topic: type === 'practice' ? (topic ? topic : null) : null,
      questionPaperUrl: downloadUrl,
      questionPaperPath: destPath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.update(uploadRef, {
      status: 'approved',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: uid,
      assessmentId,
      promotedPath: destPath,
      promotedUrl: downloadUrl,
    });
  });

  return { assessmentId, downloadUrl };
});

export const banUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  await requireAdmin(uid);

  const targetUid = String((request.data as any)?.uid ?? '');
  const banned = Boolean((request.data as any)?.banned);
  if (!targetUid) throw new HttpsError('invalid-argument', 'uid is required');

  await auth.updateUser(targetUid, { disabled: banned });
  await db.doc(`users/${targetUid}`).set(
    {
      banned,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { uid: targetUid, banned };
});

async function sha256FromGcsObject(objectPath: string) {
  const hash = crypto.createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    bucket
      .file(objectPath)
      .createReadStream()
      .on('data', (chunk) => hash.update(chunk))
      .on('error', (e) => reject(e))
      .on('end', () => resolve());
  });
  return hash.digest('hex');
}

export const onAssessmentFileFinalized = onObjectFinalized(async (event) => {
  const objectPath = event.data.name;
  if (!objectPath) return;
  if (!objectPath.startsWith('assessments/')) return;

  const parts = objectPath.split('/');
  if (parts.length < 7) return;
  const assessmentId = parts[5];
  if (!assessmentId) return;

  const sha = await sha256FromGcsObject(objectPath);
  await db.doc(`assessments/${assessmentId}`).set(
    {
      sha256: sha,
      fileSize: event.data.size ? Number(event.data.size) : null,
      contentType: event.data.contentType ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});
