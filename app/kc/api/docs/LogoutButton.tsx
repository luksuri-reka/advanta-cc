'use client';

export function LogoutButton({ logoutAction }: { logoutAction: () => Promise<void> }) {
    return (
        <form action={logoutAction}>
            <button
                type="submit"
                className="kc-logout-btn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                    const btn = e.currentTarget;
                    btn.style.background = 'rgba(239, 68, 68, 0.15)';
                    btn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={e => {
                    const btn = e.currentTarget;
                    btn.style.background = 'rgba(239, 68, 68, 0.08)';
                    btn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }}
            >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
            </button>
        </form>
    );
}
