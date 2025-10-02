// app/utils/emailService.ts
export async function sendComplaintCreatedEmail(
  customerEmail: string,
  customerName: string,
  complaintNumber: string
) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'complaint_created',
        email: customerEmail,
        complaint_number: complaintNumber,
        customer_name: customerName
      })
    });

    if (!response.ok) {
      console.error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export async function sendComplaintResponseEmail(
  customerEmail: string,
  customerName: string,
  complaintNumber: string
) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'complaint_response',
        email: customerEmail,
        complaint_number: complaintNumber,
        customer_name: customerName
      })
    });

    if (!response.ok) {
      console.error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}