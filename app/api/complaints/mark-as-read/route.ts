// app/api/complaints/mark-as-read/route.ts
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/app/utils/supabase/service';
import { authorizeComplaintTeam } from '@/app/admin/complaintAccess';

// Menandai semua complaints yang belum dibaca (is_read = false) menjadi sudah dibaca.
export async function POST() {
    try {
        const access = await authorizeComplaintTeam('canViewComplaints');
        if (access.denied) return access.denied;
        const { regions } = access;
        const supabase = createServiceClient();
        let query = supabase
            .from('complaints')
            .update({ is_read: true })
            .eq('is_read', false);
        if (regions.length > 0) query = query.in('customer_province', regions);
        const { error } = await query;

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
