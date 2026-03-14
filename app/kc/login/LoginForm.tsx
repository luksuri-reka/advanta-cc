'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { kcLogin } from './actions';

const initialState = { error: null as string | null };

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(kcLogin, initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Animated particles canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.1,
            });
        }

        let animId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
                ctx.fill();
            }

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 80)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0c29 40%, #1a0533 70%, #0d1117 100%)' }}>

            {/* Animated Canvas Background */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ opacity: 0.7 }}
            />

            {/* Glowing Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
                <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
                <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #db2777, transparent)' }} />
            </div>

            {/* Main Card */}
            <div
                className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{
                    background: 'rgba(15, 12, 41, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {/* Top gradient stripe */}
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), rgba(59,130,246,0.8), transparent)' }} />

                <div className="px-8 py-10">
                    {/* Logo Badge */}
                    <div className={`flex flex-col items-center mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="relative mb-4">
                            <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }} />
                            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                                    boxShadow: '0 8px 32px rgba(124, 58, 237, 0.5)',
                                    letterSpacing: '-1px',
                                }}>
                                KC
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold"
                            style={{
                                background: 'rgba(139, 92, 246, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                color: '#a78bfa',
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            KrosCek API System
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Developer Portal</h1>
                        <p className="text-sm" style={{ color: '#94a3b8' }}>Masuk untuk mengakses KrosCek API Docs</p>
                    </div>

                    {/* Form */}
                    <form action={formAction} className="space-y-4">
                        {/* Email */}
                        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
                                style={{ color: emailFocused ? '#a78bfa' : '#64748b' }}>
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                                        style={{ color: emailFocused ? '#a78bfa' : '#475569' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="admin@kroscek.com"
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    disabled={isPending}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: emailFocused ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: emailFocused ? '0 0 0 3px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
                                style={{ color: passFocused ? '#a78bfa' : '#64748b' }}>
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                                        style={{ color: passFocused ? '#a78bfa' : '#475569' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••••••"
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                    disabled={isPending}
                                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: passFocused ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: passFocused ? '0 0 0 3px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center px-1 transition-colors"
                                    style={{ color: showPassword ? '#a78bfa' : '#475569' }}
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {state?.error && (
                            <div className="flex items-start gap-3 p-3.5 rounded-xl text-sm animate-slide-in-bottom"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fca5a5',
                                }}>
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {state.error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className={`pt-2 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="group relative w-full py-4 rounded-xl font-bold text-white text-sm tracking-wide overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                                    boxShadow: isPending ? 'none' : '0 4px 24px rgba(124, 58, 237, 0.5)',
                                    transform: isPending ? 'scale(0.98)' : 'scale(1)',
                                }}
                                onMouseEnter={e => {
                                    if (!isPending) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(124, 58, 237, 0.7)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(124, 58, 237, 0.5)';
                                }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

                                <div className="relative flex items-center justify-center gap-2.5">
                                    {isPending ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Memverifikasi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span>Akses Developer Portal</span>
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 text-center"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: '#334155' }}>
                            <svg className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Koneksi terenkripsi — Akses hanya untuk developer
                        </div>
                        <p className="mt-2 text-xs" style={{ color: '#1e293b' }}>
                            © 2025 KrosCek · Advanta Seeds Indonesia
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
