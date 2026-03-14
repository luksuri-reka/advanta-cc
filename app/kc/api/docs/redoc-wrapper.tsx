'use client';

import dynamic from 'next/dynamic';

const RedocStandalone = dynamic(
    () => import('redoc').then(m => m.RedocStandalone),
    { ssr: false, loading: () => <RedocLoader /> }
);

function RedocLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 900, color: 'white',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                animation: 'kc-redoc-pulse 1.5s ease-in-out infinite',
            }}>KC</div>
            <div style={{ color: '#475569', fontSize: '13px', letterSpacing: '0.05em' }}>
                Memuat dokumentasi API...
            </div>
            <style>{`
                @keyframes kc-redoc-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
                    50% { transform: scale(1.08); box-shadow: 0 12px 32px rgba(124,58,237,0.6); }
                }
            `}</style>
        </div>
    );
}

export default function RedocWrapper({ isDark }: { isDark: boolean }) {
    const darkTheme = {
        colors: {
            primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#ffffff' },
            success: { main: '#4ade80' },
            warning: { main: '#fbbf24' },
            error: { main: '#f87171' },
            text: { primary: '#e2e8f0', secondary: '#94a3b8' },
            border: { dark: 'rgba(139, 92, 246, 0.25)', light: 'rgba(255, 255, 255, 0.06)' },
            responses: {
                success: { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.08)', tabTextColor: '#4ade80' },
                error: { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.08)', tabTextColor: '#f87171' },
                redirect: { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.08)', tabTextColor: '#fbbf24' },
                info: { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.08)', tabTextColor: '#60a5fa' },
            },
            http: { get: '#2563eb', post: '#16a34a', put: '#ea580c', delete: '#dc2626', patch: '#d97706', head: '#7c3aed', options: '#475569', basic: '#475569', link: '#a78bfa' },
        },
        typography: {
            fontSize: '14px', lineHeight: '1.6',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            smoothing: 'antialiased', optimizeSpeed: true,
            headings: { fontFamily: "'Inter', sans-serif", fontWeight: '700', lineHeight: '1.3' },
            code: { fontSize: '13px', fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace", lineHeight: '1.6', fontWeight: '400', color: '#a78bfa', backgroundColor: 'rgba(124,58,237,0.08)', wrap: false },
            links: { color: '#7c3aed', visited: '#5b21b6', hover: '#a78bfa' },
        },
        sidebar: {
            width: '280px', backgroundColor: '#0a0d12', textColor: '#94a3b8', activeTextColor: '#a78bfa',
            groupItems: { activeBackgroundColor: 'rgba(124,58,237,0.12)', activeTextColor: '#a78bfa' },
            level1Items: { activeBackgroundColor: 'rgba(124,58,237,0.08)', activeTextColor: '#c4b5fd', textTransform: 'none' as const },
            arrow: { size: '1.2em', color: '#475569' },
        },
        rightPanel: { backgroundColor: '#161b22', width: '40%', textColor: '#94a3b8' },
        spacing: { unit: 5, sectionHorizontal: 32, sectionVertical: 20 },
        breakpoints: { small: '50rem', medium: '75rem', large: '105rem' },
        codeBlock: { backgroundColor: '#0a0d14' },
        fab: { backgroundColor: '#7c3aed', color: '#fff' },
        schema: {
            nestedBackground: '#161b22', linesColor: 'rgba(139,92,246,0.2)',
            defaultDetailsWidth: '75%', typeNameColor: '#60a5fa', typeTitleColor: '#a78bfa',
            requireLabelColor: '#f87171', labelsTextSize: '0.85em', nestingSpacing: '1em',
            arrow: { size: '1.1em', color: '#7c3aed' },
        },
        logo: { maxHeight: '60px', maxWidth: '180px', gutter: '16px' },
    };

    const lightTheme = {
        colors: {
            primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#ffffff' },
            success: { main: '#16a34a' },
            warning: { main: '#d97706' },
            error: { main: '#dc2626' },
            text: { primary: '#1e1b4b', secondary: '#64748b' },
            border: { dark: 'rgba(124, 58, 237, 0.2)', light: 'rgba(124, 58, 237, 0.08)' },
            responses: {
                success: { color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.06)', tabTextColor: '#16a34a' },
                error: { color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.06)', tabTextColor: '#dc2626' },
                redirect: { color: '#d97706', backgroundColor: 'rgba(217,119,6,0.06)', tabTextColor: '#d97706' },
                info: { color: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', tabTextColor: '#2563eb' },
            },
            http: { get: '#2563eb', post: '#16a34a', put: '#ea580c', delete: '#dc2626', patch: '#d97706', head: '#7c3aed', options: '#64748b', basic: '#64748b', link: '#7c3aed' },
        },
        typography: {
            fontSize: '14px', lineHeight: '1.6',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            smoothing: 'antialiased', optimizeSpeed: true,
            headings: { fontFamily: "'Inter', sans-serif", fontWeight: '700', lineHeight: '1.3' },
            code: { fontSize: '13px', fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace", lineHeight: '1.6', fontWeight: '400', color: '#5b21b6', backgroundColor: 'rgba(124,58,237,0.06)', wrap: false },
            links: { color: '#7c3aed', visited: '#5b21b6', hover: '#6d28d9' },
        },
        sidebar: {
            width: '280px', backgroundColor: '#f5f3ff', textColor: '#4c1d95', activeTextColor: '#7c3aed',
            groupItems: { activeBackgroundColor: 'rgba(124,58,237,0.1)', activeTextColor: '#7c3aed' },
            level1Items: { activeBackgroundColor: 'rgba(124,58,237,0.07)', activeTextColor: '#5b21b6', textTransform: 'none' as const },
            arrow: { size: '1.2em', color: '#a78bfa' },
        },
        rightPanel: { backgroundColor: '#1e1b4b', width: '40%', textColor: '#c4b5fd' },
        spacing: { unit: 5, sectionHorizontal: 32, sectionVertical: 20 },
        breakpoints: { small: '50rem', medium: '75rem', large: '105rem' },
        codeBlock: { backgroundColor: '#0f0e1a' },
        fab: { backgroundColor: '#7c3aed', color: '#fff' },
        schema: {
            nestedBackground: '#f5f3ff', linesColor: 'rgba(124,58,237,0.15)',
            defaultDetailsWidth: '75%', typeNameColor: '#2563eb', typeTitleColor: '#7c3aed',
            requireLabelColor: '#dc2626', labelsTextSize: '0.85em', nestingSpacing: '1em',
            arrow: { size: '1.1em', color: '#7c3aed' },
        },
        logo: { maxHeight: '60px', maxWidth: '180px', gutter: '16px' },
    };

    return (
        <RedocStandalone
            specUrl="/api/kc/spec"
            options={{
                expandSingleSchemaField: true,
                expandResponses: '200,201',
                hideHostname: false,
                hideLoading: false,
                pathInMiddlePanel: false,
                sortPropsAlphabetically: false,
                showExtensions: false,
                nativeScrollbars: false,
                theme: isDark ? darkTheme : lightTheme,
            }}
        />
    );
}
