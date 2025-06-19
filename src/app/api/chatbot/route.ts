import { createAIAgent } from "@/lib/ai/agent/aiAgent";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Pesan harus berupa teks" },
        { status: 400 }
      );
    }

    const agentExecutor = await createAIAgent();

    const result = await agentExecutor.invoke({
      input: message,
    });

    const rawOutput = result?.output || "Tidak ada respon.";
    const cleanOutput = rawOutput.replace(/```(?:json)?|```/g, "").trim();

    return NextResponse.json({
      response: cleanOutput,
      success: true,
      tool_used: true,
    });
  } catch (error) {
    console.error("Agent Error:", error);
    return NextResponse.json(
      {
        error: "Gagal memproses permintaan",
        details: error instanceof Error ? error.message : String(error),
        success: false,
        tool_used: false,
      },
      { status: 500 }
    );
  }
}
