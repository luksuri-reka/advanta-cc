// app/api/notifications/whatsapp/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ++ UBAH: Ambil SEMUA parameter yang mungkin ++
    const { 
      type, 
      phone, 
      customer_name, 
      complaint_number, 
      survey_id,
      product_name,
      serial,
      rating 
    } = body;

    // 1. Validasi input
    // ++ UBAH: Validasi dasar sekarang adalah type dan phone ++
    if (!type || !phone) {
      return NextResponse.json({ error: 'Missing required parameters (type, phone)' }, { status: 400 });
    }

    // 2. Ambil Token dari environment
    const token = process.env.FONNTE_API_TOKEN;
    if (!token) {
      console.error('FONNTE_API_TOKEN is not set in .env.local');
      return NextResponse.json({ error: 'WhatsApp service not configured' }, { status: 500 });
    }

    // 3. Buat isi pesan berdasarkan tipe notifikasi
    let messageText = '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (type === 'complaint_created') {
      // Pastikan data yang diperlukan ada
      if (!complaint_number || !customer_name) {
        return NextResponse.json({ error: 'Missing complaint_number or customer_name for complaint_created' }, { status: 400 });
      }
      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;
      messageText = `Halo ${customer_name},\n\nTerima kasih! Komplain Anda (${complaint_number}) telah kami terima. Kami akan segera menindaklanjutinya.\n\nAnda bisa melacak status komplain di:\n${trackUrl}\n\nTerima kasih,\nPT Advanta Seeds Indonesia.`;
    
    } else if (type === 'complaint_status_update') {
      if (!complaint_number || !customer_name) {
        return NextResponse.json({ error: 'Missing complaint_number or customer_name for complaint_status_update' }, { status: 400 });
      }
      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;
      messageText = `Halo ${customer_name},\n\nUpdate untuk komplain Anda (${complaint_number}): Status telah diperbarui. Silakan cek link di bawah untuk detailnya.\n\n${trackUrl}\n\nTerima kasih,\nPT Advanta Seeds Indonesia.`;
    
    } else if (type === 'survey_submitted') {
      if (!customer_name) {
        return NextResponse.json({ error: 'Missing customer_name for survey_submitted' }, { status: 400 });
      }
      messageText = `Halo ${customer_name},\n\nTerima kasih banyak atas partisipasi Anda dalam mengisi survey kami! 🌟\n\nFeedback Anda sangat berharga untuk membantu kami terus meningkatkan kualitas produk dan layanan.\n\nSalam,\nPT Advanta Seeds Indonesia.`;
    
    // ++ TAMBAHKAN BLOK 'else if' DI BAWAH INI ++
    } else if (type === 'survey_admin_notification') {
      if (!survey_id || !customer_name) {
        return NextResponse.json({ error: 'Missing survey_id or customer_name for survey_admin_notification' }, { status: 400 });
      }
      
      const overallRating = Number(rating) || 0;
      // Hapus spasi ekstra dari template literal untuk pesan WA
      messageText = `🔔 *Survey Baru Diterima!*

*ID Survey:* ${survey_id}
*Tanggal:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
*Nama Pelanggan:* ${customer_name}
*Rating Keseluruhan:* ${overallRating > 0 ? '⭐'.repeat(overallRating) : 'Belum dinilai'}

*Produk:* ${product_name || 'N/A'}
*Serial/Lot:* ${serial || 'N/A'}

Silakan cek dashboard admin untuk detail lebih lanjut.`;
    // ++ AKHIR TAMBAHAN ++

    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // 4. Siapkan payload untuk Fonnte
    const payload = new URLSearchParams();
    payload.append('target', phone);
    payload.append('message', messageText);
    payload.append('countryCode', '62');

    // 5. Kirim request ke Fonnte API
    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token, // Kirim token di header
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString() // Kirim payload sebagai string
    });

    const responseData = await fonnteResponse.json();

    if (!fonnteResponse.ok || responseData.status === false) {
      console.error('Fonnte API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: responseData.reason || 'Unknown' },
        { status: 500 }
      );
    }

    console.log('WhatsApp message sent:', responseData);
    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
      fonnte_details: responseData
    });

  } catch (error: any) {
    console.error('Error in POST /api/notifications/whatsapp:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}