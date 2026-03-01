// app/api/complaints/[id]/approval/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { data: approval, error } = await supabase
            .from('complaint_approvals')
            .select('*, requested_user:requested_by(full_name, department), approved_user:approved_by(full_name, department)')
            .eq('complaint_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: approval || null });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const approvalData = {
            complaint_id: id,
            requested_by: user.id,
            status: 'pending',
            replacement_item: body.replacement_item,
            notes: body.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('complaint_approvals')
            .insert(approvalData)
            .select()
            .single();

        if (error) throw error;

        // Optional: Auto-update the complaint status to mention it is waiting for approval
        await supabase.from('complaints').update({ updated_at: new Date().toISOString() }).eq('id', id);

        return NextResponse.json({ success: true, data, message: 'Approval requested successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to request approval', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We only update the LATEST pending approval for this complaint
        const { data: latestPending } = await supabase
            .from('complaint_approvals')
            .select('id')
            .eq('complaint_id', id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!latestPending) {
            return NextResponse.json({ error: 'No pending approval found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('complaint_approvals')
            .update({
                status: body.status, // 'approved' or 'rejected'
                approved_by: user.id,
                notes: body.notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', latestPending.id)
            .select()
            .single();

        if (error) throw error;

        // Optional: Automatically update the main complaints table based on the approval
        if (body.status === 'approved') {
            const { data: approvalDetails } = await supabase.from('complaint_approvals').select('replacement_item').eq('id', latestPending.id).single();
            if (approvalDetails) {
                await supabase.from('complaints').update({
                    acknowledged_replacement_hybrid: approvalDetails.replacement_item,
                    status: 'decision', // Push to decision or resolved depending on business workflow
                    updated_at: new Date().toISOString()
                }).eq('id', id);
            }
        }

        return NextResponse.json({ success: true, data, message: `Approval ${body.status} successfully` });

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update approval', details: error.message }, { status: 500 });
    }
}
