// app/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './utils/supabase';
import type { User } from '@supabase/supabase-js';

// Definisikan tipe untuk context
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Buat context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true, // Mulai dengan loading true
});

// Buat komponen Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil sesi saat komponen pertama kali dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Dengarkan perubahan status otentikasi (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Hentikan listener saat komponen dilepas
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Buat custom hook untuk menggunakan context ini
export const useAuth = () => {
  return useContext(AuthContext);
};