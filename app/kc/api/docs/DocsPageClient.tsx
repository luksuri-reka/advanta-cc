'use client';

import { useEffect, useState } from 'react';
import { LogoutButton } from './LogoutButton';
import RedocWrapper from './redoc-wrapper';

const STORAGE_KEY = 'kc-theme';

interface Props {
    logoutAction: () => Promise<void>;
}

export default function DocsPageClient({ logoutAction }: Props) {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) setIsDark(saved === 'dark');
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    };

    // ── Theme tokens ─────────────────────────────────────────────────────────
    const t = isDark ? {
        pageBg: '#0d1117',
        headerBg: 'rgba(13, 17, 23, 0.95)',
        headerBorder: 'rgba(139, 92, 246, 0.15)',
        headerShadow: '0 4px 24px rgba(0,0,0,0.4)',
        titleColor: '#f1f5f9',
        subtitleColor: '#475569',
        badgeBg: 'rgba(139, 92, 246, 0.1)',
        badgeBorder: 'rgba(139, 92, 246, 0.2)',
        badgeColor: '#a78bfa',
    } : {
        pageBg: '#f8faff',
        headerBg: 'rgba(248, 250, 255, 0.95)',
        headerBorder: 'rgba(124, 58, 237, 0.12)',
        headerShadow: '0 4px 24px rgba(124,58,237,0.08)',
        titleColor: '#1e1b4b',
        subtitleColor: '#94a3b8',
        badgeBg: 'rgba(124, 58, 237, 0.08)',
        badgeBorder: 'rgba(124, 58, 237, 0.15)',
        badgeColor: '#7c3aed',
    };

    // Avoid flash before mounting (localStorage read)
    if (!mounted) return null;

    return (
        <div style={{ minHeight: '100vh', background: t.pageBg, transition: 'background 0.3s ease' }}>

            {/* Sticky Header */}
            <header style={{
                background: t.headerBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${t.headerBorder}`,
                position: 'sticky',
                top: 0,
                zIndex: 200,
                boxShadow: t.headerShadow,
                transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}>
                {/* Top gradient accent line */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, #7c3aed, #2563eb, #7c3aed)',
                    backgroundSize: '200%',
                    animation: 'kc-gradient 4s ease infinite',
                }} />

                <style>{`
                    @keyframes kc-gradient {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    @keyframes kc-pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}</style>

                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px',
                }}>
                    {/* Left: Logo */}
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
                            flexShrink: 0,
                        }}>KC</div>

                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: t.titleColor, lineHeight: 1.2, transition: 'color 0.3s' }}>
                                KrosCek API
                            </div>
                            <div style={{ fontSize: '11px', color: t.subtitleColor, letterSpacing: '0.05em', lineHeight: 1, transition: 'color 0.3s' }}>
                                DEVELOPER DOCS
                            </div>
                        </div>

                        {/* Live badge */}
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
                            color: '#16a34a',
                            marginLeft: '8px',
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#4ade80',
                                display: 'inline-block',
                                animation: 'kc-pulse 2s infinite',
                            }} />
                            Live
                        </div>
                    </div>

                    {/* Right: badges + toggle + logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            background: t.badgeBg,
                            border: `1px solid ${t.badgeBorder}`,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: t.badgeColor,
                            letterSpacing: '0.04em',
                            transition: 'background 0.3s, border-color 0.3s, color 0.3s',
                        }}>
                            REST API v1
                        </div>

                        {/* Theme toggle button */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${t.badgeBorder}`,
                                background: t.badgeBg,
                                cursor: 'pointer',
                                color: t.badgeColor,
                                transition: 'all 0.2s',
                            }}
                        >
                            {isDark ? (
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="5" />
                                    <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            ) : (
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                </svg>
                            )}
                        </button>

                        <LogoutButton logoutAction={logoutAction} />
                    </div>
                </div>
            </header>

            {/* Redoc */}
            <RedocWrapper isDark={isDark} />
        </div>
    );
}
