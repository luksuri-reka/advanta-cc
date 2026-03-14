import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import DocsPageClient from './DocsPageClient';

async function logout() {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set('kc-docs-access', '', { maxAge: 0, path: '/' });
    revalidatePath('/kc/api/docs');
    redirect('/kc/login');
}

export default async function ApiDocsPage() {
    const cookieStore = await cookies();
    const access = cookieStore.get('kc-docs-access')?.value;
    if (access !== 'granted') {
        redirect('/kc/login');
    }

    return <DocsPageClient logoutAction={logout} />;
}