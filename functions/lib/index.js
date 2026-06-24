"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssessmentFileFinalized = exports.banUser = exports.promoteUserUpload = void 0;
const crypto = __importStar(require("crypto"));
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("firebase-functions/v2/storage");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
async function requireAdmin(uid) {
    const snap = await db.doc(`admins/${uid}`).get();
    if (!snap.exists)
        throw new https_1.HttpsError('permission-denied', 'Not an admin');
    const data = snap.data();
    return { role: data?.role ?? 'university_admin', universityId: data?.universityId ?? null };
}
function buildDownloadUrl(bucketName, objectPath, token) {
    const encoded = encodeURIComponent(objectPath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}
exports.promoteUserUpload = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    await requireAdmin(uid);
    const userUploadId = String(request.data?.userUploadId ?? '');
    const assessmentInput = request.data?.assessment ?? null;
    if (!userUploadId)
        throw new https_1.HttpsError('invalid-argument', 'userUploadId is required');
    if (!assessmentInput)
        throw new https_1.HttpsError('invalid-argument', 'assessment is required');
    const universityId = String(assessmentInput.universityId ?? '');
    const moduleId = String(assessmentInput.moduleId ?? '').toUpperCase();
    const type = String(assessmentInput.type ?? '');
    const year = Number(assessmentInput.year ?? NaN);
    const title = String(assessmentInput.title ?? '');
    const topic = String(assessmentInput.topic ?? '');
    if (!universityId || !moduleId || !type || !Number.isFinite(year) || !title) {
        throw new https_1.HttpsError('invalid-argument', 'assessment fields invalid');
    }
    const uploadRef = db.doc(`user_uploads/${userUploadId}`);
    const uploadSnap = await uploadRef.get();
    if (!uploadSnap.exists)
        throw new https_1.HttpsError('not-found', 'user_uploads doc not found');
    const upload = uploadSnap.data();
    if (upload.status !== 'pending')
        throw new https_1.HttpsError('failed-precondition', 'Upload not pending');
    if (!upload.storagePath || !upload.fileName)
        throw new https_1.HttpsError('failed-precondition', 'Upload missing storagePath/fileName');
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
exports.banUser = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    await requireAdmin(uid);
    const targetUid = String(request.data?.uid ?? '');
    const banned = Boolean(request.data?.banned);
    if (!targetUid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    await auth.updateUser(targetUid, { disabled: banned });
    await db.doc(`users/${targetUid}`).set({
        banned,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { uid: targetUid, banned };
});
async function sha256FromGcsObject(objectPath) {
    const hash = crypto.createHash('sha256');
    await new Promise((resolve, reject) => {
        bucket
            .file(objectPath)
            .createReadStream()
            .on('data', (chunk) => hash.update(chunk))
            .on('error', (e) => reject(e))
            .on('end', () => resolve());
    });
    return hash.digest('hex');
}
exports.onAssessmentFileFinalized = (0, storage_1.onObjectFinalized)(async (event) => {
    const objectPath = event.data.name;
    if (!objectPath)
        return;
    if (!objectPath.startsWith('assessments/'))
        return;
    const parts = objectPath.split('/');
    if (parts.length < 7)
        return;
    const assessmentId = parts[5];
    if (!assessmentId)
        return;
    const sha = await sha256FromGcsObject(objectPath);
    await db.doc(`assessments/${assessmentId}`).set({
        sha256: sha,
        fileSize: event.data.size ? Number(event.data.size) : null,
        contentType: event.data.contentType ?? null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
});
