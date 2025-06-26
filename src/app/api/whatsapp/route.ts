import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipients, template } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Invalid recipients data' }, { status: 400 });
    }

    if (!template || typeof template !== 'string') {
      return NextResponse.json({ error: 'Template is required and must be a string' }, { status: 400 });
    }

    const ACCESS_TOKEN = "EAARPPEm9XyMBO37Y3OalDUlB7FeBOtnESHLiA83D2lVtGurZCYUP1AuARHORAksLuwYYZBY88rQAN5deFWB49HLfYCXHjj7bts5bg1UuVOLx6wWh8dwozVqnIwwrc1kNuSlZA2x5GEVPRrKq2MuKCj8550hSygrsFTfhTTAVm7jQ2NraFMZCA2WcIpW8yRgjT1B0UJi4et7iwAmexMGm0xybwsZBUDAYVuZCkGFAqji2OOTQZDZD";
    const PHONE_NUMBER_ID = "678646702004861";

    const results = await Promise.all(
      recipients.map(async (recipient: any) => {
        try {
          const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

          // Gantikan semua {nama} dengan recipient.name
          const messageText = template.replace(/{nama}/gi, recipient.name);

          const data = {
            messaging_product: "whatsapp",
            to: recipient.no,
            type: "template",
            template: { name: "reminder", language: {code:"en_US"} }
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              "Authorization": `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          return {
            name: recipient.name,
            no: recipient.no,
            success: response.ok,
            response: result
          };
        } catch (error: any) {
          return {
            name: recipient.name,
            no: recipient.no,
            success: false,
            error: error.message
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      sent_count: results.filter(r => r.success).length,
      failed_count: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Error sending WhatsApp messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
