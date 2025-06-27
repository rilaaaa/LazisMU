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

    const ACCESS_TOKEN = "EAARPPEm9XyMBO8XQACs9d9xGrrihqLkmQzPcCRqVe0ByfY2jD4FwRALoRKSOfo3UU4sbPswWHeviIrbxfZCjHkTt7yaD6OumHQhqmCvPdI5q0PzzlDNy49pmEeDaMJV1paEHwINskRd3eHKZA0UGylhBelR5BfPIIuLilJ3ZCzqZAuVjYOvaVJiuJczpMUzWhSEIYyixQphpNWcDzrtZC58UMUgbbVHwz02D4DEK0wu6evAZDZD";
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
