import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConsoleCallbackHandler } from "langchain/callbacks";
import { Database } from "@/db/db";

// --- Setup Gemini model ---
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
  temperature: 0.1,
  maxOutputTokens: 2048,
  topP: 0.3,
  topK: 10,
});

// --- Sequelize instance ---
const sequelize = Database;

// --- Struktur DB untuk prompt ---
const schemaGuide = `
Struktur database PostgreSQL:
1. Tabel: jurnals
  - id: integer, primary key
  - name: string
  - jenisJurnal: string

2. Tabel: "JurnalDataCleanings"
  - id: integer, primary key
  - jurnal_id: foreign key → jurnals.id
  - nama: string
  - no_hp: string
  - tanggal: date
  - tahun: integer
  - zis: string
  - via: string
  - sumber_dana: string
  - kategori: string
  - nominal: float
  - jenis_donatur: string

Relasi antar tabel:
- jurnals memiliki banyak JurnalDataCleanings
- JurnalDataCleanings memiliki jurnal_id sebagai foreign key ke jurnals.id
`;

// --- API handler ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body.question;

    if (!question) {
      return NextResponse.json({ error: "Pertanyaan tidak ditemukan." }, { status: 400 });
    }

    // 1. Klasifikasi intent
    const detectIntentPrompt = `
Tentukan maksud pengguna dari pertanyaan berikut:

- Jika hanya ingin mengobrol / bercakap biasa → balas dengan "chat"
- Jika ingin melihat data dari database → balas dengan "data"
- Jika ingin menampilkan chart (grafik, visualisasi, tren, distribusi, dsb) → balas dengan "chart"

Pertanyaan: "${question}"
Jawaban (hanya salah satu: chat, data, chart):
    `;

    const intentResult = await model.invoke(detectIntentPrompt, {
      callbacks: [new ConsoleCallbackHandler()]
    });
    const intent = intentResult.content?.trim().toLowerCase();

    if (intent === "chat") {
      const reply = await model.invoke(`Jawab secara singkat dan informatif pertanyaan berikut: "${question}"`);
      return NextResponse.json({ intent, reply: reply.content });
    }

    if (intent === "data" || intent === "chart") {
      // 2. Generate SQL query
      const sqlPrompt = `
Berikut adalah struktur database:

${schemaGuide}

Buat query SELECT berdasarkan pertanyaan ini:
"${question}"

Catatan:
- Gunakan hanya SELECT
- Perhatikan huruf besar kecil
- Berikan tanda kutip untuk tabel "JurnalDataCleanings"
      `;

      const sqlResult = await model.invoke(sqlPrompt);
      let sqlQuery = sqlResult.content?.toString().trim() || "";
      sqlQuery = sqlQuery.replace(/```sql|```/gi, "").trim();

      if (!sqlQuery.toLowerCase().startsWith("select")) {
        return NextResponse.json({ error: "Query yang dihasilkan bukan SELECT.", generatedQuery: sqlQuery }, { status: 400 });
      }

      // 3. Jalankan query
      const [results] = await sequelize.query(sqlQuery);

      // 4. Format hasil
      if (intent === "chart") {
  // Strukturisasi hasil agar sesuai dengan format chart
  const rows = results as any[];
  if (!rows || rows.length === 0) {
    return NextResponse.json({
      intent,
      generatedQuery: sqlQuery,
      chartData: null,
      suggestion: "Data kosong, tidak dapat membentuk chart."
    });
  }

  const firstRow = rows[0];
  const columns = Object.keys(firstRow);

  // Pastikan ada minimal dua kolom untuk label dan data
  if (columns.length < 2) {
    return NextResponse.json({
      intent,
      generatedQuery: sqlQuery,
      chartData: null,
      suggestion: "Query harus menghasilkan minimal dua kolom: label dan nilai."
    });
  }

  const labelKey = columns[0]; // kolom pertama sebagai label
  const dataKey = columns[1]; // kolom kedua sebagai nilai

  const labels = rows.map((row) => row[labelKey]);
  const data = rows.map((row) => row[dataKey]);

  const chartData = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${dataKey}`,
        data,
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
        ].slice(0, data.length)
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  };

  return NextResponse.json({
    intent,
    generatedQuery: sqlQuery,
    chartData
  });
}

      return NextResponse.json({ intent, generatedQuery: sqlQuery, results });
    }

    return NextResponse.json({ error: "Intent tidak dikenali.", detail: intent }, { status: 400 });

  } catch (err: any) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan.", detail: err.message }, { status: 500 });
  }
}
