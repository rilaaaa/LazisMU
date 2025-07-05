// src/app/api/grafik-penyaluran/route.ts

import { JurnalDataPenyaluran } from "@/db/db";
import { NextResponse } from "next/server";
import { fn, col } from "sequelize";

// Tipe data ini SAMA PERSIS dengan yang ada di komponen frontend Anda
interface PenyaluranDashboardData {
    [sumberDana: string]: {
        total: number;
        detail: { name: string; value: number }[];
    };
}

export async function GET() {
    try {
        const results = await JurnalDataPenyaluran.findAll({
            attributes: [
                'sumber_dana',
                'jenis_penyaluran',
                [fn('SUM', col('nominal')), 'total_nominal']
            ],
            group: ['sumber_dana', 'jenis_penyaluran'],
            order: [
                ['sumber_dana', 'ASC'],
                [fn('SUM', col('nominal')), 'DESC']
            ],
            raw: true,
        });

        const processedData = (results as any[]).reduce<PenyaluranDashboardData>((acc, item) => {
            const { sumber_dana, jenis_penyaluran, total_nominal } = item;
            if (!acc[sumber_dana]) {
                acc[sumber_dana] = { total: 0, detail: [] };
            }
            acc[sumber_dana].total += Number(total_nominal);
            acc[sumber_dana].detail.push({
                name: jenis_penyaluran,
                value: Number(total_nominal),
            });
            return acc;
        }, {});

        return NextResponse.json({ status: 'success', data: processedData });

    } catch (error) {
        console.error('API /api/grafik-penyaluran Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
    }
}