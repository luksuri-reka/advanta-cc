// app/api/complaints/mark-as-read/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

// Menandai semua complaints yang belum dibaca (is_read = false) menjadi sudah dibaca.
export async function POST() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('complaints')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) {
            console.error('mark-as-read error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('mark-as-read error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
