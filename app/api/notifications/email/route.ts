// app/api/notifications/email/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, complaint_number, customer_name } = body;

    // Skip if email notifications disabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled, skipping...');
      return NextResponse.json({ 
        success: true, 
        message: 'Email notifications disabled' 
      });
    }

    // Get base URL - fallback to request origin
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000';

    // Dynamic import Resend only when needed
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    let subject = '';
    let htmlContent = '';
    let html = '';

    switch (type) {
      case 'complaint_created':
        subject = `Komplain Anda Telah Diterima - ${complaint_number}`;
        htmlContent = generateComplaintCreatedEmail(customer_name, complaint_number, baseUrl);
        break;
      
      case 'complaint_response':
        subject = `Update Komplain ${complaint_number}`;
        htmlContent = generateComplaintResponseEmail(customer_name, complaint_number, baseUrl);
        break;
        
      case 'status_update': {
        const { complaint_number, customer_name, new_status } = body;
        
        const statusLabels: Record<string, string> = {
          submitted: 'Dikirim',
          acknowledged: 'Dikonfirmasi',
          investigating: 'Sedang Diselidiki',
          pending_response: 'Menunggu Respons Anda',
          resolved: 'Selesai',
          closed: 'Ditutup'
        };

        const statusDescriptions: Record<string, string> = {
          submitted: 'Komplain Anda telah diterima oleh sistem kami dan menunggu verifikasi tim.',
          acknowledged: 'Komplain Anda telah dikonfirmasi dan dialokasikan ke departemen yang tepat untuk penanganan lebih lanjut.',
          investigating: 'Tim kami sedang aktif menyelidiki dan menganalisis masalah yang Anda laporkan.',
          pending_response: 'Kami membutuhkan informasi tambahan dari Anda. Mohon cek pesan terbaru dan berikan respons Anda.',
          resolved: 'Komplain Anda telah diselesaikan. Terima kasih atas kesabaran Anda.',
          closed: 'Kasus komplain Anda telah ditutup.'
        };

        const statusColors: Record<string, string> = {
          submitted: '#3B82F6',
          acknowledged: '#F59E0B',
          investigating: '#F97316',
          pending_response: '#A855F7',
          resolved: '#10B981',
          closed: '#6B7280'
        };

        subject = `Update Status Komplain ${complaint_number}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Update Status Komplain</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <img src="${process.env.NEXT_PUBLIC_BASE_URL}/advanta-logo-white.png" alt="Advanta Logo" style="height: 50px; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Status Komplain Diperbarui</h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Halo <strong>${customer_name}</strong>,
                </p>
                
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                  Status komplain Anda telah diperbarui. Berikut adalah informasi terbaru:
                </p>

                <!-- Complaint Info -->
                <div style="background-color: #f9fafb; border-left: 4px solid ${statusColors[new_status]}; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Nomor Komplain</span>
                    <span style="color: #1f2937; font-size: 18px; font-weight: 700;">${complaint_number}</span>
                  </div>
                  <div>
                    <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 8px;">Status Terbaru</span>
                    <span style="display: inline-block; background-color: ${statusColors[new_status]}; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                      ${statusLabels[new_status]}
                    </span>
                  </div>
                </div>

                <!-- Status Description -->
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                  <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                    <strong>Apa artinya?</strong><br>
                    ${statusDescriptions[new_status]}
                  </p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/complaint/${complaint_number}/status" 
                    style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                    Lihat Detail Komplain
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                  Jika Anda memiliki pertanyaan atau memerlukan bantuan lebih lanjut, jangan ragu untuk menghubungi tim customer care kami.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                  PT Advanta Seeds Indonesia<br>
                  Email: ${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@advanta.co.id'}<br>
                  Website: ${process.env.NEXT_PUBLIC_BASE_URL}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                  Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;
      }
        
      default:
        subject = `Notifikasi dari Advanta Seeds - ${complaint_number}`;
        htmlContent = generateGenericEmail(customer_name, complaint_number, baseUrl);
    }

    

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@advantaindonesia.com',
      to: email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      email_id: data?.id
    });

  } catch (error: any) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' }, 
      { status: 500 }
    );
  }
}

function generateComplaintCreatedEmail(customerName: string, complaintNumber: string, baseUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Komplain Diterima - Advanta Seeds</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
            Komplain Telah Diterima
          </h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">
            PT Advanta Seeds Indonesia
          </p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
            Halo ${customerName},
          </h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Terima kasih telah menghubungi kami. Komplain Anda telah kami terima dan akan segera ditindaklanjuti.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #10b981; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
              📋 Detail Komplain
            </h3>
            <p style="margin: 5px 0; color: #374151;">
              <strong>Nomor Komplain:</strong> ${complaintNumber}
            </p>
            <p style="margin: 5px 0; color: #374151;">
              <strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}
            </p>
            <p style="margin: 5px 0; color: #374151;">
              <strong>Status:</strong> Diterima
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Tim customer care kami akan menindaklanjuti komplain Anda dalam waktu maksimal 
            <strong style="color: #10b981;">24 jam</strong>. Anda dapat melacak status komplain 
            menggunakan nomor referensi di atas.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/complaint/${complaintNumber}/status" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Lacak Status Komplain
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Jika Anda memiliki pertanyaan, silakan balas email ini atau hubungi customer care kami.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            © ${new Date().getFullYear()} PT Advanta Seeds Indonesia<br>
            Email ini dikirim secara otomatis, mohon jangan membalas.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateComplaintResponseEmail(customerName: string, complaintNumber: string, baseUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Update Komplain - Advanta Seeds</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
            Update Komplain Anda
          </h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">
            PT Advanta Seeds Indonesia
          </p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
            Halo ${customerName},
          </h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Ada update terbaru untuk komplain Anda dengan nomor <strong style="color: #3b82f6;">${complaintNumber}</strong>.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/complaint/${complaintNumber}/status" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Lihat Update Lengkap
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Silakan klik tombol di atas untuk melihat detail update terbaru dari tim kami.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            © ${new Date().getFullYear()} PT Advanta Seeds Indonesia
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateGenericEmail(customerName: string, complaintNumber: string, baseUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notifikasi - Advanta Seeds</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
            Notifikasi dari Advanta Seeds
          </h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
            Halo ${customerName},
          </h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Ada notifikasi terkait komplain Anda dengan nomor <strong>${complaintNumber}</strong>.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/complaint/${complaintNumber}/status" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Lihat Detail
            </a>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            © ${new Date().getFullYear()} PT Advanta Seeds Indonesia
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}