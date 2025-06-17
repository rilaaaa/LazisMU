import { NextResponse } from 'next/server';
import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const whatsappFrom = 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER!;

const client = Twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pesan = formData.get('pesan') as string;
    const muzakkiIds = JSON.parse(formData.get('muzakkiIds') as string);
    const poster = formData.get('poster') as File | null;

    // Ambil data muzakki dari DB atau API internal
    const muzakkiList = [ /* ambil dari DB berdasar muzakkiIds */ ];

    // Kirim WA per muzakki
    const sendPromises = muzakkiList.map(async (m) => {
      const bodyText = pesan;
      if (poster) {
        // Upload poster ke CDN dan dapatkan URL (opsional)
        await client.messages.create({
          from: whatsappFrom,
          to: 'whatsapp:' + m.phoneNumber,
          mediaUrl: ['https://.../poster.jpg'],
          body: bodyText,
        });
      } else {
        await client.messages.create({
          from: whatsappFrom,
          to: 'whatsapp:' + m.phoneNumber,
          body: bodyText,
        });
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sent: muzakkiIds.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
