import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipients, template } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Invalid recipients data' }, { status: 400 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template is required' }, { status: 400 });
    }

    const ACCESS_TOKEN = "EAARPPEm9XyMBO2LDbqQwRh3cWuOLDUuUE7YVSE8tq7vWZAhR0sw9lPiJ2JxvX6ObtyEZC1ucvbApewZBZADqTGc1PQHCq6HqLaxoHq0e7KfJCiT4po28kbN2Vq4Cbn2hs78NLRNXKP2ZBQ3nBxcXkGovsCRU7eBF3gQMsZA7VvNxA3Nt0bM0eNqCRYNCGU1BeiXlrTgEBgK90qoNk5z8pfZB2jOXvyuVycRtJ03eLLGNF2amwZDZD";
    const PHONE_NUMBER_ID = "702625622932177";

    const results = await Promise.all(
      recipients.map(async (recipient: any) => {
        try {
          const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

          const messageBody = template.replace('{name}', recipient.name);

          const data = {
            messaging_product: "whatsapp",
            to: recipient.no,
            type: "template",
            template: { name: "hello_world", language: {code:"en_US"} }
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
