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

    const ACCESS_TOKEN = "EAARPPEm9XyMBO3TlOUFoBgXjZAzG8kpbT3YobZCC2wUUSlvYM5DK3WQWQjZC7bTHGPp4M1yauTXZAXYHKArCWSqlLlaOKZCNb3vpvocmPpoQJQzhFH4srlrbevqZAagUOPuL79oqORUl7RVX2NDgPxvCp4qefd8ZBu1fq4zyUbCHI2TpywbNtYzZB1T5HvPkFMo0KzIlTqZA8ZB7EtFfo5exBZCXLIqXUt0faTvlWeXU1BqOrp6pfIZD";
    const PHONE_NUMBER_ID = "702625622932177";

    const results = await Promise.all(
      recipients.map(async (recipient: any) => {
        try {
          const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

          // Gantikan semua {nama} dengan recipient.name
          const messageText = template.replace(/{nama}/gi, recipient.name);

          const data = {
            messaging_product: "whatsapp",
            to: recipient.no,
            type: "text",
            text: {
              body: messageText
            }
            // type: "template",
            // template: { name: "event_rsvp", language: {code:"en_US"} }
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