"use server";

import { JurnalData } from "@/db/db";
import { JurnalDataRow } from "@/lib/types";

export async function GET() {
    await JurnalData.sync();

    const sql_res = await JurnalData.findAll();
    const actual_data = [];

    for (let i = 0; i < sql_res.length; i++) {
        const row = sql_res[i].get() as JurnalDataRow;

        const data = {
            id: row.id,
            name: row.nama,
            phoneNumber: row.no_hp,
            gender: 'Unknown',
            age: 0,
            occupation: 'Unknown',
            donationType: row.zis,
            donorType: row.jenis_donatur,
            status: 'Aktif',
            year: row.tahun,
        }

        actual_data.push(data);
    }

    return new Response(JSON.stringify({
        status: 'success',
        data: actual_data
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}