'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

// Dummy/fallback credentials (for development and testing access)
const DUMMY_EMAIL = 'admin@kroscek.com';
const DUMMY_PASSWORD = 'kroscek2024';

export async function kcLogin(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email dan kata sandi wajib diisi.' };
    }

    const cookieStore = await cookies();

    // Check dummy credentials first (always works regardless of Supabase)
    if (email === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
        cookieStore.set('kc-docs-access', 'granted', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 4, // 4 hours
            path: '/',
        });
        redirect('/kc/api/docs');
    }

    // Try Supabase authentication
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_KROSCEK_URL!,
        process.env.NEXT_PUBLIC_KROSCEK_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'Email atau kata sandi salah.' };
        }
        return { error: error.message };
    }

    // Set access cookie on success as well (belt and suspenders approach)
    cookieStore.set('kc-docs-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 4, // 4 hours
        path: '/',
    });

    redirect('/kc/api/docs');
}
