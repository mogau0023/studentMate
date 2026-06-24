import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

type Config = {
  maintenanceMode?: boolean;
  adsEnabled?: boolean;
  uploadsEnabled?: boolean;
  uploadMaxMb?: number;
  updatedAt?: unknown;
};

export function SystemConfigPage() {
  const [cfg, setCfg] = useState<Config>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, 'system_config', 'app');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setCfg((snap.data() as Config) ?? {});
      },
      () => {},
    );
    return () => unsub();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="title">System Config</div>
          <div className="muted">Feature flags and operational limits</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Maintenance mode</span>
            <input
              type="checkbox"
              checked={!!cfg.maintenanceMode}
              disabled={saving}
              onChange={(e) => setCfg((p) => ({ ...p, maintenanceMode: e.target.checked }))}
            />
          </label>
          <label className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Ads enabled</span>
            <input
              type="checkbox"
              checked={cfg.adsEnabled ?? true}
              disabled={saving}
              onChange={(e) => setCfg((p) => ({ ...p, adsEnabled: e.target.checked }))}
            />
          </label>
          <label className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Uploads enabled</span>
            <input
              type="checkbox"
              checked={cfg.uploadsEnabled ?? true}
              disabled={saving}
              onChange={(e) => setCfg((p) => ({ ...p, uploadsEnabled: e.target.checked }))}
            />
          </label>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Upload max size (MB)
            </div>
            <input
              className="input"
              type="number"
              value={String(cfg.uploadMaxMb ?? 20)}
              disabled={saving}
              onChange={(e) => setCfg((p) => ({ ...p, uploadMaxMb: Number(e.target.value) }))}
            />
          </div>
          {error ? <div className="pill danger">{error}</div> : null}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="button primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  await setDoc(
                    doc(db, 'system_config', 'app'),
                    {
                      ...cfg,
                      uploadMaxMb: Number.isFinite(cfg.uploadMaxMb) ? cfg.uploadMaxMb : 20,
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true },
                  );
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
          <div className="muted">
            Mobile app does not yet read these flags. Use as a foundation for operational controls and future feature gates.
          </div>
        </div>
      </div>
    </div>
  );
}

