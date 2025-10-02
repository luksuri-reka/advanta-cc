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

    switch (type) {
      case 'complaint_created':
        subject = `Komplain Anda Telah Diterima - ${complaint_number}`;
        htmlContent = generateComplaintCreatedEmail(customer_name, complaint_number, baseUrl);
        break;
      
      case 'complaint_response':
        subject = `Update Komplain ${complaint_number}`;
        htmlContent = generateComplaintResponseEmail(customer_name, complaint_number, baseUrl);
        break;
        
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