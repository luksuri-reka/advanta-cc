// app/api/complaints/[id]/status/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

// Daftar status yang valid (sesuaikan jika perlu, agar sama dengan di frontend)
const complaintStatuses = [
  'submitted',
  'acknowledged',
  'investigating',
  'pending_response',
  'resolved',
  'closed'
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Autentikasi Pengguna
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil Payload dari Frontend
    const body = await request.json();
    const { status } = body; 

    // 3. Validasi Payload
    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    if (!complaintStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status value: ${status}` 
      }, { status: 400 });
    }

    // 4. Ambil Data Keluhan Saat Ini (untuk logging)
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('status, resolved_at') // Ambil status lama
      .eq('id', id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ 
        error: 'Complaint not found' 
      }, { status: 404 });
    }

    // Jika status sudah sama, tidak perlu update
    if (complaint.status === status) {
      return NextResponse.json({ 
        message: 'Status is already set to this value',
        data: complaint
      }, { status: 200 });
    }

    // 5. Siapkan Data Update
    const updateData: {
      status: string;
      updated_at: string;
      resolved_at?: string; // Opsional
      resolved_by?: string; // Opsional
    } = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    // --- LOGIKA TAMBAHAN ---
    // Jika status diubah menjadi 'resolved' atau 'closed',
    // dan belum ada tgl penyelesaian, set tglnya sekarang.
    if (
      (status === 'resolved' || status === 'closed') &&
      !complaint.resolved_at 
    ) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id; // Catat siapa yang menyelesaikannya
    }
    
    // 6. Update Database Keluhan
    const { error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Update status error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update complaint status' 
      }, { status: 500 });
    }

    // 7. (Best Practice) Catat Riwayat Perubahan Status
    // Anda disarankan memiliki tabel 'complaint_history' untuk ini
    await supabase
      .from('complaint_history') // Ganti nama tabel jika perlu
      .insert({
        complaint_id: parseInt(id),
        action: 'status_changed',
        old_value: complaint.status,
        new_value: status,
        created_by: user.id,
        notes: `Status changed to ${status} by admin`
      });

    return NextResponse.json({ 
      success: true,
      message: `Complaint status updated to ${status}`
    });

  } catch (error: any) {
    console.error('Update Status API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}