import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from './firebase';
import { AdminRecord } from './types';

type AuthState = {
  user: User | null;
  admin: AdminRecord | null;
  loading: boolean;
  signOutNow: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setAdmin(null);
      return;
    }

    const adminRef = doc(db, 'admins', user.uid);
    const unsub = onSnapshot(
      adminRef,
      (snap) => {
        setAdmin(snap.exists() ? (snap.data() as AdminRecord) : null);
      },
      () => {
        setAdmin(null);
      },
    );
    return () => unsub();
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      admin,
      loading,
      signOutNow: () => signOut(auth),
    }),
    [user, admin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
