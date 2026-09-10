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
            .select('*')
            .eq('complaint_id', parseInt(id, 10))
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (approval) {
            const userIdsToFetch = [approval.requested_by, approval.approved_by].filter(Boolean);
            if (userIdsToFetch.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_complaint_profiles')
                    .select('user_id, full_name, department')
                    .in('user_id', userIdsToFetch);

                if (profiles) {
                    const profileMap = profiles.reduce((acc: any, p: any) => {
                        acc[p.user_id] = p;
                        return acc;
                    }, {});
                    approval.requested_user = profileMap[approval.requested_by] || null;
                    approval.approved_user = approval.approved_by ? (profileMap[approval.approved_by] || null) : null;
                }
            }
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

        const replacementItem = typeof body.replacement_item === 'string'
            ? body.replacement_item.trim()
            : '';
        const replacementQty = body.replacement_qty == null ? null : Number(body.replacement_qty);
        const replacementProductName = typeof body.replacement_product_name === 'string'
            ? body.replacement_product_name.trim()
            : '';

        if (!replacementItem) {
            return NextResponse.json({ error: 'Item penggantian wajib diisi' }, { status: 400 });
        }

        if (replacementQty !== null && (!Number.isFinite(replacementQty) || replacementQty <= 0)) {
            return NextResponse.json({ error: 'Qty penggantian harus lebih dari 0 Kg' }, { status: 400 });
        }

        if (replacementQty !== null && (!body.replacement_product_id || !replacementProductName)) {
            return NextResponse.json({ error: 'Produk penggantian wajib dipilih dari daftar produk' }, { status: 400 });
        }

        if (body.replacement_destination_type && !['distributor', 'retailer'].includes(body.replacement_destination_type)) {
            return NextResponse.json({ error: 'Tujuan penggantian tidak valid' }, { status: 400 });
        }

        const { data: activePending, error: pendingError } = await supabase
            .from('complaint_approvals')
            .select('id')
            .eq('complaint_id', parseInt(id, 10))
            .eq('status', 'pending')
            .limit(1)
            .maybeSingle();

        if (pendingError) throw pendingError;
        if (activePending) {
            return NextResponse.json({ error: 'Masih ada request approval yang menunggu keputusan' }, { status: 409 });
        }

        // The observation remains the canonical proposal shown in admin/customer summaries.
        if (replacementQty !== null && replacementProductName) {
            const { error: observationError } = await supabase
                .from('complaint_observations')
                .update({
                    replacement_qty: replacementQty,
                    replacement_product_id: Number(body.replacement_product_id),
                    replacement_hybrid: replacementProductName,
                    replacement_destination_type: body.replacement_destination_type || null,
                    replacement_distributor_id: body.replacement_destination_type === 'distributor' && body.replacement_distributor_id
                        ? Number(body.replacement_distributor_id)
                        : null,
                    replacement_destination_name: body.replacement_destination_name?.trim() || null,
                    replacement_destination_address: body.replacement_destination_address?.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('complaint_id', parseInt(id, 10));

            if (observationError) throw observationError;
        }

        const approvalData = {
            complaint_id: parseInt(id, 10),
            requested_by: user.id,
            status: 'pending',
            replacement_item: replacementItem,
            replacement_qty: replacementQty,
            replacement_product_id: body.replacement_product_id ? Number(body.replacement_product_id) : null,
            replacement_product_name: replacementProductName || null,
            replacement_destination_type: body.replacement_destination_type || null,
            replacement_distributor_id: body.replacement_destination_type === 'distributor' && body.replacement_distributor_id
                ? Number(body.replacement_distributor_id)
                : null,
            replacement_destination_name: body.replacement_destination_name?.trim() || null,
            replacement_destination_address: body.replacement_destination_address?.trim() || null,
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
        return NextResponse.json({ error: error.message || 'Gagal mengajukan approval' }, { status: 500 });
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

        if (!['approved', 'rejected'].includes(body.status)) {
            return NextResponse.json({ error: 'Status approval tidak valid' }, { status: 400 });
        }

        const complaintId = parseInt(id, 10);
        const { data: complaint, error: complaintError } = await supabase
            .from('complaints')
            .select('assignee_approval')
            .eq('id', complaintId)
            .single();

        if (complaintError || !complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
        }

        if (complaint.assignee_approval !== user.id) {
            return NextResponse.json(
                { error: 'Hanya petugas approval yang ditugaskan pada komplain ini yang dapat memberikan keputusan' },
                { status: 403 }
            );
        }

        // We only update the LATEST pending approval for this complaint
        const { data: latestPending } = await supabase
            .from('complaint_approvals')
            .select('id')
            .eq('complaint_id', complaintId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!latestPending) {
            return NextResponse.json({ error: 'No pending approval found' }, { status: 404 });
        }

        const approvalUpdate: Record<string, unknown> = {
            status: body.status,
            approved_by: user.id,
            updated_at: new Date().toISOString()
        };
        if (typeof body.notes === 'string') {
            approvalUpdate.notes = body.notes.trim() || null;
        }

        const { data, error } = await supabase
            .from('complaint_approvals')
            .update(approvalUpdate)
            .eq('id', latestPending.id)
            .select()
            .single();

        if (error) throw error;

        // Optional: Automatically update the main complaints table based on the approval
        if (body.status === 'approved') {
            const { data: approvalDetails } = await supabase
                .from('complaint_approvals')
                .select('replacement_item, replacement_qty, replacement_product_name')
                .eq('id', latestPending.id)
                .single();
            if (approvalDetails) {
                const legacyItem = String(approvalDetails.replacement_item || '')
                    .match(/^\s*([\d.,]+)\s*Kg\s*(?:-\s*)?(.+?)\s*$/i);
                const replacementQty = approvalDetails.replacement_qty ??
                    (legacyItem ? Number(legacyItem[1].replace(',', '.')) : null);
                const replacementProductName = approvalDetails.replacement_product_name ||
                    (legacyItem ? legacyItem[2].trim() : approvalDetails.replacement_item);
                const complaintUpdate: Record<string, unknown> = {
                    status: 'decision', // Push to decision or resolved depending on business workflow
                    updated_at: new Date().toISOString()
                };
                if (replacementQty != null && Number.isFinite(Number(replacementQty))) {
                    complaintUpdate.acknowledged_replacement_qty = Number(replacementQty);
                }
                if (replacementProductName) {
                    complaintUpdate.acknowledged_replacement_hybrid = replacementProductName;
                }
                const { error: complaintUpdateError } = await supabase
                    .from('complaints').update(complaintUpdate).eq('id', complaintId);
                if (complaintUpdateError) throw complaintUpdateError;
            }
        }

        return NextResponse.json({ success: true, data, message: `Approval ${body.status} successfully` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Gagal memperbarui approval' }, { status: 500 });
    }
}
