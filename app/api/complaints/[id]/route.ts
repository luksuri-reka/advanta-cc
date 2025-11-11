// app/api/complaints/[id]/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

// --- FUNGSI HELPER BARU ---
// (Fungsi ini sudah benar, tidak perlu diubah)
async function getUserProfile(supabase: SupabaseClient, userId: string | null) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_complaint_profiles') 
      .select('user_id, full_name, department')
      .eq('user_id', userId) 
      .single();
      
    if (error || !data) {
      console.error(`Error fetching profile for ${userId}:`, error?.message);
      return null;
    }
    
    return {
      id: data.user_id,
      name: data.full_name, 
      department: data.department
    };
  } catch (err) {
    return null;
  }
}

// --- FUNGSI GET UTAMA (YANG DIPERBARUI) ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // --- LANGKAH 1: Ambil data keluhan utama (query sederhana) ---
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_responses (
          id,
          message,
          admin_name,
          admin_id,
          created_at,
          is_customer_response:is_internal 
        )
      `)
      .eq('id', id)
      .order('created_at', { 
        foreignTable: 'complaint_responses', 
        ascending: true 
      })
      .single();

    if (complaintError) {
      // INI ADALAH ERROR YANG ANDA LIHAT
      console.error("Error fetching base complaint:", complaintError.message); 
      return NextResponse.json({ error: complaintError.message }, { status: 500 });
    }

    if (!complaint) {
      return NextResponse.json({ error: 'Komplain tidak ditemukan' }, { status: 404 });
    }

    // --- LANGKAH 2: Ambil data pengguna secara manual ---
    // (Ini sudah benar, tidak perlu diubah)
    const [
      assigned_to_user,
      assigned_by_user,
      resolved_by_user,
      escalated_by_user,
      created_by_user
    ] = await Promise.all([
      getUserProfile(supabase, complaint.assigned_to),
      getUserProfile(supabase, complaint.assigned_by),
      getUserProfile(supabase, complaint.resolved_by),
      getUserProfile(supabase, complaint.escalated_by),
      getUserProfile(supabase, complaint.created_by)
    ]);

    // --- LANGKAH 3: Gabungkan data secara manual ---
    // (Ini sudah benar, tidak perlu diubah)
    const finalComplaintData = {
      ...complaint,
      assigned_to_user,
      assigned_by_user,
      resolved_by_user,
      escalated_by_user,
      created_by_user
    };

    // --- LANGKAH 4: Kirim data yang sudah lengkap ---
    return NextResponse.json({ data: finalComplaintData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}