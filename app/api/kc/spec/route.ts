import { NextResponse } from 'next/server';

// Proxy route: fetches the KrosCek PostgREST OpenAPI spec server-side
// and returns it to Redoc on the client without exposing the apikey as a URL param
export async function GET() {
    const kcUrl = process.env.NEXT_PUBLIC_KROSCEK_URL;
    const kcKey = process.env.NEXT_PUBLIC_KROSCEK_ANON_KEY;

    // Pastikan env variable tersedia — wajib didaftarkan di Vercel/production
    if (!kcUrl || !kcKey) {
        console.error('[KrosCek Spec Proxy] Missing env vars: NEXT_PUBLIC_KROSCEK_URL or NEXT_PUBLIC_KROSCEK_ANON_KEY');
        return NextResponse.json(
            { error: 'Server misconfigured: missing KrosCek environment variables.' },
            { status: 500 }
        );
    }

    const url = `${kcUrl}/rest/v1/`;

    try {
        const res = await fetch(url, {
            headers: {
                'apikey': kcKey,
                'Authorization': `Bearer ${kcKey}`,
                'Accept': 'application/openapi+json, application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error(`[KrosCek Spec Proxy] Upstream error: ${res.status} ${res.statusText}`);
            return NextResponse.json(
                { error: `Upstream error: ${res.status}` },
                { status: res.status }
            );
        }

        const spec = await res.json();

        return NextResponse.json(spec, {
            headers: {
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        console.error('[KrosCek Spec Proxy] Fetch error:', err);
        return NextResponse.json(
            { error: 'Failed to reach Supabase PostgREST endpoint.' },
            { status: 500 }
        );
    }
}
