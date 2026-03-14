'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues (redoc uses browser APIs)
const RedocStandalone = dynamic(
    () => import('redoc').then(m => m.RedocStandalone),
    { ssr: false, loading: () => <RedocLoader /> }
);

function RedocLoader() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 900,
                color: 'white',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                animation: 'kc-pulse 1.5s ease-in-out infinite',
            }}>KC</div>
            <div style={{ color: '#475569', fontSize: '13px', letterSpacing: '0.05em' }}>
                Memuat dokumentasi API...
            </div>
            <style>{`
                @keyframes kc-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
                    50% { transform: scale(1.08); box-shadow: 0 12px 32px rgba(124,58,237,0.6); }
                }
            `}</style>
        </div>
    );
}

export default function RedocWrapper({ url }: { url: string }) {
    return (
        <RedocStandalone
            specUrl={url}
            options={{
                // === Layout ===
                expandSingleSchemaField: true,
                expandResponses: '200,201',
                hideHostname: false,
                hideLoading: false,
                pathInMiddlePanel: false,
                sortPropsAlphabetically: false,
                showExtensions: false,
                nativeScrollbars: false,

                // === Theming ===
                theme: {
                    // Base colors
                    colors: {
                        primary: {
                            main: '#7c3aed',
                            light: '#a78bfa',
                            dark: '#5b21b6',
                            contrastText: '#ffffff',
                        },
                        success: { main: '#4ade80' },
                        warning: { main: '#fbbf24' },
                        error: { main: '#f87171' },
                        text: {
                            primary: '#e2e8f0',
                            secondary: '#94a3b8',
                        },
                        border: {
                            dark: 'rgba(139, 92, 246, 0.25)',
                            light: 'rgba(255, 255, 255, 0.06)',
                        },
                        responses: {
                            success: { color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.08)', tabTextColor: '#4ade80' },
                            error: { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.08)', tabTextColor: '#f87171' },
                            redirect: { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.08)', tabTextColor: '#fbbf24' },
                            info: { color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.08)', tabTextColor: '#60a5fa' },
                        },
                        http: {
                            get: '#2563eb',
                            post: '#16a34a',
                            put: '#ea580c',
                            delete: '#dc2626',
                            patch: '#d97706',
                            head: '#7c3aed',
                            options: '#475569',
                            basic: '#475569',
                            link: '#a78bfa',
                        },
                    },

                    // Typography
                    typography: {
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        smoothing: 'antialiased',
                        optimizeSpeed: true,
                        headings: {
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '700',
                            lineHeight: '1.3',
                        },
                        code: {
                            fontSize: '13px',
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            lineHeight: '1.6',
                            fontWeight: '400',
                            color: '#a78bfa',
                            backgroundColor: 'rgba(124, 58, 237, 0.08)',
                            wrap: false,
                        },
                        links: {
                            color: '#7c3aed',
                            visited: '#5b21b6',
                            hover: '#a78bfa',
                        },
                    },

                    // Sidebar
                    sidebar: {
                        width: '280px',
                        backgroundColor: '#0a0d12',
                        textColor: '#94a3b8',
                        activeTextColor: '#a78bfa',
                        groupItems: {
                            activeBackgroundColor: 'rgba(124, 58, 237, 0.12)',
                            activeTextColor: '#a78bfa',
                        },
                        level1Items: {
                            activeBackgroundColor: 'rgba(124, 58, 237, 0.08)',
                            activeTextColor: '#c4b5fd',
                            textTransform: 'none',
                        },
                        arrow: {
                            size: '1.2em',
                            color: '#475569',
                        },
                    },

                    // Logo area
                    logo: {
                        maxHeight: '60px',
                        maxWidth: '180px',
                        gutter: '16px',
                    },

                    // Right panel (code examples)
                    rightPanel: {
                        backgroundColor: '#161b22',
                        width: '40%',
                        textColor: '#94a3b8',
                    },

                    // Main page background & layout
                    spacing: {
                        unit: 5,
                        sectionHorizontal: 32,
                        sectionVertical: 20,
                    },
                    breakpoints: {
                        small: '50rem',
                        medium: '75rem',
                        large: '105rem',
                    },
                    codeBlock: {
                        backgroundColor: '#0a0d14',
                    },
                    fab: {
                        backgroundColor: '#7c3aed',
                        color: '#fff',
                    },
                    schema: {
                        nestedBackground: '#161b22',
                        linesColor: 'rgba(139, 92, 246, 0.2)',
                        defaultDetailsWidth: '75%',
                        typeNameColor: '#60a5fa',
                        typeTitleColor: '#a78bfa',
                        requireLabelColor: '#f87171',
                        labelsTextSize: '0.85em',
                        nestingSpacing: '1em',
                        arrow: {
                            size: '1.1em',
                            color: '#7c3aed',
                        },
                    },
                },
            }}
        />
    );
}
