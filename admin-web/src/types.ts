export type AdminRole = 'superadmin' | 'university_admin';

export type AdminRecord = {
  email: string;
  role: AdminRole;
  universityId?: string;
};

export type University = {
  name: string;
  code: string;
  logoUrl?: string;
};

export type ModuleRecord = {
  code: string;
  name: string;
  universityId: string;
  course?: string;
  isFeatured?: boolean;
};

export type AssessmentType = 'practice' | 'test' | 'exam' | 'supplementary';

export type Assessment = {
  universityId: string;
  moduleId: string;
  type: AssessmentType;
  topic?: string;
  year: number;
  title: string;
  questionPaperUrl?: string;
  questionPaperPath?: string;
  memoUrl?: string;
  memoPath?: string;
  videoSolutionUrl?: string;
  createdAt?: unknown;
  sha256?: string;
};

export type UserProfile = {
  name?: string;
  email?: string;
  universityId?: string;
  universityName?: string;
  points?: number;
  subscriptionActive?: boolean;
  subscriptionExpiry?: unknown;
  banned?: boolean;
  role?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserUpload = {
  uid: string;
  email?: string;
  title: string;
  year: number;
  moduleCode: string;
  paperType: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  storagePath: string;
  downloadUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'error';
  createdAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  reviewNotes?: string;
  assessmentId?: string;
};

export type Report = {
  uid: string;
  email?: string;
  subject: string;
  details: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  createdAt?: unknown;
  updatedAt?: unknown;
  handledBy?: string;
};

export type UploadBatchStatus = 'running' | 'completed' | 'failed' | 'rolled_back';

export type UploadBatch = {
  createdAt: unknown;
  createdBy: string;
  status: UploadBatchStatus;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
};

export type UploadBatchItem = {
  fileName: string;
  mimeType?: string;
  size?: number;
  sha256?: string;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'rolled_back';
  error?: string;
  assessmentId?: string;
  storagePath?: string;
  downloadUrl?: string;
  metadata?: Record<string, unknown>;
  startedAt?: unknown;
  finishedAt?: unknown;
};
