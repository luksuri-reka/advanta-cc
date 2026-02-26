import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const encodedUrl = searchParams.get('url');

    if (!encodedUrl) {
        return new NextResponse('URL Parameter is missing', { status: 400 });
    }

    try {
        // Obfuscate the URL via base64
        const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');

        // Basic validation to make sure we're only proxying supabase storage URLs
        // Note: adjust the string match to your Supabase project URL if needed.
        if (!url.includes('.supabase.co/storage/')) {
            return new NextResponse('Invalid image URL source', { status: 403 });
        }

        const imageResponse = await fetch(url);

        if (!imageResponse.ok) {
            return new NextResponse('Failed to fetch image', { status: imageResponse.status });
        }

        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const buffer = await imageResponse.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                // Cache the image heavily since complaint images don't change
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
