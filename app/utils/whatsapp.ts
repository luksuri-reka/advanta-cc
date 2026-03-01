// app/utils/whatsapp.ts

/**
 * Validates and formats a phone number to Indonesian WhatsApp format (62...)
 */
export function formatWhatsAppNumber(phone: string | null | undefined): string | null {
    if (!phone) return null;

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Replace leading 0 with 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }

    // Ensure it starts with 62
    if (!cleaned.startsWith('62')) {
        // If it's just a local number missing the prefix, assume 62
        cleaned = '62' + cleaned;
    }

    return cleaned;
}

/**
 * Sends a WhatsApp message using the Fonnte API
 */
export async function sendWhatsAppMessage(targetNumber: string, message: string): Promise<boolean> {
    const formattedNumber = formatWhatsAppNumber(targetNumber);

    if (!formattedNumber) {
        console.warn('❌ Cannot send WA: Invalid or missing phone number');
        return false;
    }

    const token = process.env.FONNTE_TOKEN;

    if (!token) {
        console.warn('❌ Cannot send WA: FONNTE_TOKEN is not defined in environment variables');
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('target', formattedNumber);
        formData.append('message', message);
        // Optional delay or country code parameters can be added here
        // formData.append('delay', '2'); 
        // formData.append('countryCode', '62'); 

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token, // Fonnte requires the raw token here
            },
            body: formData
        });

        const result = await response.json();

        if (result.status) {
            console.log(`✅ Fonnte WA message queued successfully to ${formattedNumber}`);
            return true;
        } else {
            console.error(`❌ Fonnte API Error: ${result.reason || JSON.stringify(result)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Failed to reach Fonnte API:`, error);
        return false;
    }
}
