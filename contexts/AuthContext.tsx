"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn() {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    setGoogleAccessToken(credential?.accessToken ?? null);
  }

  async function logOut() {
    setGoogleAccessToken(null);
    await signOut(auth);
  }

  async function getIdToken() {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, signIn, logOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
