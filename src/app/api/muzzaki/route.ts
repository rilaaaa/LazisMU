"use server";

import { JurnalData, JurnalDataCleaning } from "@/db/db";
import { JurnalDataRow } from "@/lib/types";

export async function GET() {
    await JurnalDataCleaning.sync();

    const sql_res = await JurnalDataCleaning.findAll();
    const actual_data = [];

    for (let i = 0; i < sql_res.length; i++) {
        const row = sql_res[i].get() as JurnalDataRow;

        const data = {
            id: row.id,
            name: row.nama,
            phoneNumber: row.no_hp,
            gender: 'Unknown',
            occupation: 'Unknown',
            donationType: row.sumber_dana,
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