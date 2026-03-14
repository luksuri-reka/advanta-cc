import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LogoutButton } from './LogoutButton';
import RedocWrapper from './redoc-wrapper';
import { revalidatePath } from 'next/cache';

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

    return (
        <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0' }}>

            {/* Premium Header */}
            <header style={{
                background: 'rgba(13, 17, 23, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

                    {/* Left: Logo + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '13px',
                            color: 'white',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                        }}>KC</div>

                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9', lineHeight: 1.2 }}>
                                KrosCek API
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.05em', lineHeight: 1 }}>
                                DEVELOPER DOCS
                            </div>
                        </div>

                        {/* Live Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#4ade80',
                            marginLeft: '8px',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                            Live
                        </div>
                    </div>

                    {/* Right: Meta + Logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#a78bfa',
                            letterSpacing: '0.04em',
                        }}>
                            REST API v1
                        </div>
                        <LogoutButton logoutAction={logout} />
                    </div>
                </div>
            </header>

            {/* Redoc — 3-panel premium API docs, compatible with Swagger 2.0 */}
            <RedocWrapper url="/api/kc/spec" />
        </div>
    );
}