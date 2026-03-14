import { NextResponse } from 'next/server';

// Proxy route: fetches the KrosCek PostgREST OpenAPI spec server-side
// and returns it to Scalar on the client without exposing the apikey as a URL param
export async function GET() {
    const url = `${process.env.NEXT_PUBLIC_KROSCEK_URL}/rest/v1/`;

    try {
        const res = await fetch(url, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_KROSCEK_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KROSCEK_ANON_KEY!}`,
                'Accept': 'application/openapi+json, application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch spec', status: res.status },
                { status: res.status }
            );
        }

        const spec = await res.json();

        return NextResponse.json(spec, {
            headers: {
                'Cache-Control': 'public, max-age=60',
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        console.error('[KrosCek Spec Proxy] Error:', err);
        return NextResponse.json({ error: 'Internal error fetching spec' }, { status: 500 });
    }
}
