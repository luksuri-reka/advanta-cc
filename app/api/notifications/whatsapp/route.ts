// app/api/notifications/whatsapp/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      type,
      customer_phone,
      target_phone,
      customer_name,
      complaint_number,
      survey_id,
      product_name,
      serial,
      rating,
      new_status,
      category_name,
      subject
    } = body;

    // Validasi input
    if (!type || (!customer_phone && !target_phone)) {
      return NextResponse.json({ error: 'Missing required parameters (type, phone)' }, { status: 400 });
    }

    // Ambil Token dari environment
    const token = process.env.FONNTE_API_TOKEN;
    if (!token) {
      console.error('FONNTE_API_TOKEN is not set in .env.local');
      return NextResponse.json({ error: 'WhatsApp service not configured' }, { status: 500 });
    }

    // Buat isi pesan berdasarkan tipe notifikasi
    let messageText = '';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (type === 'complaint_created') {
      if (!complaint_number || !customer_name) {
        return NextResponse.json({ error: 'Missing complaint_number or customer_name for complaint_created' }, { status: 400 });
      }

      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;

      messageText = `📋 *Komplain Berhasil Dikirim*

Halo *${customer_name}*,

Terima kasih! Komplain Anda telah kami terima dan akan segera ditindaklanjuti.

📝 *Nomor Komplain:* ${complaint_number}
⏰ *Status:* Diterima
🕐 *Estimasi Respons:* Maksimal 24 jam

Anda dapat melacak status komplain kapan saja melalui link berikut:
🔗 ${trackUrl}

---
*PT Advanta Seeds Indonesia*
Layanan Customer Care`;

    } else if (type === 'complaint_status_update') {
      if (!complaint_number || !customer_name) {
        return NextResponse.json({ error: 'Missing complaint_number or customer_name for complaint_status_update' }, { status: 400 });
      }
      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;

      messageText = `🔔 *Update Status Komplain*

Halo *${customer_name}*,

Status komplain Anda telah diperbarui.

📋 *Nomor Komplain:* ${complaint_number}

Silakan cek link berikut untuk melihat detail terbaru:
🔗 ${trackUrl}

---
*PT Advanta Seeds Indonesia*
Layanan Customer Care`;

    } else if (type === 'status_update') {
      if (!complaint_number || !customer_name || !new_status) {
        return NextResponse.json({ error: 'Missing required fields for status_update' }, { status: 400 });
      }

      const statusLabels: Record<string, string> = {
        submitted: 'Dikirim',
        acknowledged: 'Dikonfirmasi',
        observation: 'Proses Observasi',
        investigation: 'Proses Investigasi & Lab Testing',
        decision: 'Menunggu Keputusan',
        pending_response: 'Menunggu Respons Anda',
        resolved: 'Selesai',
        closed: 'Ditutup'
      };

      const statusEmojis: Record<string, string> = {
        submitted: '📝',
        acknowledged: '✅',
        observation: '👀',
        investigation: '🔬',
        decision: '⚖️',
        pending_response: '⏳',
        resolved: '🎉',
        closed: '🔒'
      };

      const statusMessages: Record<string, string> = {
        pending_response: 'Kami membutuhkan informasi tambahan dari Anda. Mohon cek pesan terbaru di portal komplain.',
        resolved: 'Komplain Anda telah diselesaikan. Terima kasih atas kesabaran Anda!',
        observation: 'Tim kami sedang melakukan observasi terhadap produk yang Anda laporkan.',
        investigation: 'Produk sedang dalam proses investigasi mendalam dan lab testing.',
        decision: 'Tim kami sedang menentukan solusi terbaik untuk masalah Anda.',
        acknowledged: 'Tim kami telah menerima dan mengkonfirmasi komplain Anda.',
        closed: 'Komplain Anda telah ditutup dan diarsipkan.',
        submitted: 'Komplain Anda telah diterima dan akan segera diproses.'
      };

      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;

      messageText = `${statusEmojis[new_status]} *Update Status Komplain*

Halo *${customer_name}*,

Status komplain Anda telah diperbarui:

📋 *Nomor Komplain:* ${complaint_number}
📊 *Status Terbaru:* ${statusLabels[new_status] || new_status}

${statusMessages[new_status] || 'Tim kami sedang memproses komplain Anda.'}

🔗 Lihat detail lengkap:
${trackUrl}

---
*PT Advanta Seeds Indonesia*
Layanan Customer Care`;

    } else if (type === 'complaint_response') {
      if (!complaint_number || !customer_name) {
        return NextResponse.json({ error: 'Missing required fields for complaint_response' }, { status: 400 });
      }

      const trackUrl = `${baseUrl}/complaint/${complaint_number}/status`;

      messageText = `💬 *Pesan Baru dari Tim Kami*

Halo *${customer_name}*,

Tim kami telah mengirimkan pesan baru terkait komplain Anda.

📋 *Nomor Komplain:* ${complaint_number}

Mohon cek portal komplain untuk melihat pesan lengkap dari tim kami.

🔗 Lihat pesan:
${trackUrl}

---
*PT Advanta Seeds Indonesia*
Layanan Customer Care`;

    } else if (type === 'survey_submitted') {
      if (!customer_name) {
        return NextResponse.json({ error: 'Missing customer_name for survey_submitted' }, { status: 400 });
      }
      messageText = `🌟 *Terima Kasih atas Partisipasi Anda!*

Halo *${customer_name}*,

Terima kasih banyak atas partisipasi Anda dalam mengisi survey kami!

Feedback Anda sangat berharga untuk membantu kami terus meningkatkan kualitas produk dan layanan.

---
*PT Advanta Seeds Indonesia*`;

    } else if (type === 'survey_admin_notification') {
      if (!survey_id || !customer_name) {
        return NextResponse.json({ error: 'Missing survey_id or customer_name for survey_admin_notification' }, { status: 400 });
      }

      const overallRating = Number(rating) || 0;
      const stars = overallRating > 0 ? '⭐'.repeat(overallRating) : 'Belum dinilai';

      messageText = `📊 *Survey Baru Diterima!*

*ID Survey:* ${survey_id}
*Tanggal:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
*Nama Pelanggan:* ${customer_name}
*Rating Keseluruhan:* ${stars}

*Produk:* ${product_name || 'N/A'}
*Serial/Lot:* ${serial || 'N/A'}

Silakan cek dashboard admin untuk detail lebih lanjut.`;

    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Normalisasi nomor: 08xxx → 628xxx, 8xxx → 628xxx
    // Mendukung multiple nomor dipisah koma (untuk ADMIN_WA_NUMBERS)
    const normalizePhone = (num: string): string => {
      const cleaned = num.trim().replace(/\D/g, '');
      if (cleaned.startsWith('62')) return cleaned;
      if (cleaned.startsWith('0')) return '62' + cleaned.slice(1);
      if (cleaned.startsWith('8')) return '62' + cleaned;
      return cleaned;
    };

    const rawTarget = (target_phone || customer_phone || '').toString().trim();
    if (!rawTarget) {
      return NextResponse.json({ error: 'No valid phone target resolved' }, { status: 400 });
    }

    // Normalisasi tiap nomor (comma-separated)
    const finalTarget = rawTarget
      .split(',')
      .map(normalizePhone)
      .filter(Boolean)
      .join(',');

    console.log(`📱 [WA] Sending type="${type}" to: ${finalTarget}`);

    const payload = new URLSearchParams();
    payload.append('target', finalTarget);
    payload.append('message', messageText);
    payload.append('countryCode', '62');

    // Kirim request ke Fonnte API
    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    const responseData = await fonnteResponse.json();

    if (!fonnteResponse.ok || responseData.status === false) {
      console.error('Fonnte API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: responseData.reason || 'Unknown' },
        { status: 500 }
      );
    }

    console.log('✅ WhatsApp message sent successfully:', {
      type,
      target: finalTarget,
      complaint_number
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
      fonnte_details: responseData
    });

  } catch (error: any) {
    console.error('❌ Error in POST /api/notifications/whatsapp:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}