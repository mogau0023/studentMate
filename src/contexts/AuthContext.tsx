import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser, useSignIn, useClerk } from '@clerk/clerk-expo';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, signOut } = useClerkAuth();
  const { setActive } = useClerk();
  const { user, isLoaded } = useUser();
  const { signIn } = useSignIn();

  const login = async (email: string, password: string) => {
    const res = await signIn?.create({ identifier: email, password });
    if (res?.createdSessionId) {
      await setActive({ session: res.createdSessionId });
    }
  };

  const logout = async () => {
    await signOut();
  };

  const value = {
    user: user ?? null,
    loading: !isLoaded,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!value.loading && children}
    </AuthContext.Provider>
  );
};
