import { signInWithEmailAndPassword } from 'firebase/auth';
import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { auth } from '../firebase';

export function LoginPage() {
  const { user, admin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRedirect = useMemo(() => !!user && !!admin, [user, admin]);

  if (canRedirect) return <Navigate to="/" replace />;

  return (
    <div className="page" style={{ maxWidth: 520, margin: '64px auto' }}>
      <div className="panel">
        <div className="title">Admin Login</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Sign in with an admin account. Access requires a matching document in admins/{'{uid}'}.
        </div>

        <form
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              await signInWithEmailAndPassword(auth, email.trim(), password);
              nav('/', { replace: true });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Login failed');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Password
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <div className="pill danger" style={{ alignSelf: 'flex-start' }}>
              {error}
            </div>
          ) : null}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
