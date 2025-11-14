// app/api/notifications/whatsapp/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, phone, complaint_number, customer_name } = body;

    // 1. Validasi input
    if (!type || !phone || !complaint_number || !customer_name) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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
    const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;

    if (type === 'complaint_created') {
      messageText = `Halo ${customer_name},\n\nTerima kasih! Komplain Anda (${complaint_number}) telah kami terima. Kami akan segera menindaklanjutinya.\n\nAnda bisa melacak status komplain di:\n${trackUrl}\n\nTerima kasih,\nPT Advanta Seeds Indonesia`;
    } else if (type === 'complaint_response') {
      messageText = `Halo ${customer_name},\n\nAda update terbaru untuk komplain Anda (${complaint_number}). Tim kami telah mengirimkan balasan.\n\nSilakan lihat update lengkapnya di:\n${trackUrl}\n\nTerima kasih,\nPT Advanta Seeds Indonesia`;
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // 4. Siapkan payload untuk Fonnte (menggunakan x-www-form-urlencoded)
    const payload = new URLSearchParams();
    payload.append('target', phone);
    payload.append('message', messageText);
    payload.append('countryCode', '62'); // Opsional, tapi bagus untuk normalisasi nomor

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
      // Jangan hentikan alur utama, cukup log error
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
    console.error('WhatsApp notification route error:', error);
    return NextResponse.json(
      { error: 'Failed to send WA notification' },
      { status: 500 }
    );
  }
}