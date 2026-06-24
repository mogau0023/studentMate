export type FileKind = 'pdf' | 'doc' | 'docx' | 'png' | 'jpeg' | 'gif' | 'webp' | 'unknown';

export async function readHeader(file: File, bytes: number) {
  const buf = await file.slice(0, bytes).arrayBuffer();
  return new Uint8Array(buf);
}

function bytesToAscii(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

export async function detectFileKind(file: File): Promise<{ kind: FileKind; reason?: string }> {
  const name = file.name.toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() ?? '' : '';
  const header = await readHeader(file, 16);

  const pdf = bytesToAscii(header.slice(0, 5)) === '%PDF-';
  if (pdf) return { kind: 'pdf' };

  const png = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  if (png) return { kind: 'png' };

  const jpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (jpg) return { kind: 'jpeg' };

  const gif = bytesToAscii(header.slice(0, 6)) === 'GIF87a' || bytesToAscii(header.slice(0, 6)) === 'GIF89a';
  if (gif) return { kind: 'gif' };

  const riff = bytesToAscii(header.slice(0, 4)) === 'RIFF' && bytesToAscii(header.slice(8, 12)) === 'WEBP';
  if (riff) return { kind: 'webp' };

  const zip = header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);
  if (zip && ext === 'docx') return { kind: 'docx' };

  const ole = header[0] === 0xd0 && header[1] === 0xcf && header[2] === 0x11 && header[3] === 0xe0;
  if (ole && ext === 'doc') return { kind: 'doc' };

  if (ext === 'pdf') return { kind: 'unknown', reason: 'File extension is .pdf but signature is not PDF' };
  if (ext === 'doc' || ext === 'docx') return { kind: 'unknown', reason: 'Unsupported or invalid Word document header' };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return { kind: 'unknown', reason: 'Unsupported or invalid image header' };
  return { kind: 'unknown', reason: 'Unknown format' };
}

export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

export type ExtractedMetadata = {
  moduleCode?: string;
  year?: number;
  type?: 'practice' | 'test' | 'exam' | 'supplementary';
  topic?: string;
  title?: string;
};

export function extractMetadataFromFilename(fileName: string): ExtractedMetadata {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

  const yearMatch = cleaned.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;

  const codeMatch = cleaned.match(/\b([A-Z]{2,6}\d{2,6}[A-Z]{0,3})\b/i);
  const moduleCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;

  const lower = cleaned.toLowerCase();
  const type =
    lower.includes('practice') || lower.includes('prac')
      ? 'practice'
      : lower.includes('supp')
        ? 'supplementary'
        : lower.includes('exam')
          ? 'exam'
          : lower.includes('test')
            ? 'test'
            : undefined;

  let title = cleaned;
  if (moduleCode) title = title.replace(new RegExp(`\\b${moduleCode}\\b`, 'i'), '').trim();
  if (year) title = title.replace(new RegExp(`\\b${year}\\b`), '').trim();
  title = title.replace(/\b(practice|prac|supplementary|supp|exam|test)\b/gi, '').trim();
  title = title.replace(/\s+/g, ' ').trim();

  if (!title) title = undefined;

  return { moduleCode, year, type, title };
}
