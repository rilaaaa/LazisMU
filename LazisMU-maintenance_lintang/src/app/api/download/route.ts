"use server";

import { Jurnal, JurnalData } from "@/db/db";
import * as exceljs from 'exceljs';

interface IJournal {
    id: number;
    name: string;
}

interface IJournalData {
    id: number;
    jurnal_id: number;
    nama: string;
    no_hp: string;
    tanggal: Date;
    tahun: number;
    zis: string;
    via: string;
    sumber_dana: string;
    nominal: number;
    jenis_donatur: string;
}

export async function GET(
    request: Request,
) {
    const params_id = new URL(request.url).searchParams.get('id');

    if (!params_id) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Invalid parameter'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    let jurnal = await Jurnal.findOne({
        where: {
            id: params_id
        }
    }) as unknown as IJournal;

    if (!jurnal) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Data not found'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    let jurnal_data = await JurnalData.findAll({
        where: {
            jurnal_id: params_id
        }
    }) as unknown as IJournalData[];

    let workbook = new exceljs.Workbook();
    let worksheet = workbook.addWorksheet('Jurnal');

    /**
     *             await JurnalData.create({
                jurnal_id: res_jurnal.id,
                nama: row['nama'],
                no_hp: row['no_hp'],
                tanggal: row['tanggal'],
                tahun: row['tahun'],
                zis: row['zis'],
                via: row['via'],
                sumber_dana: row['sumber_dana'],
                nominal: row['nominal'],
                jenis_donatur: row['jenis_donatur']
            });
     */

    worksheet.columns = [
        { header: 'Nama', key: 'nama' },
        { header: 'No HP', key: 'no_hp' },
        { header: 'Tanggal', key: 'tanggal' },
        { header: 'Tahun', key: 'tahun' },
        { header: 'Zis', key: 'zis' },
        { header: 'Via', key: 'via' },
        { header: 'Sumber Dana', key: 'sumber_dana' },
        { header: 'Nominal', key: 'nominal' },
        { header: 'Jenis Donatur', key: 'jenis_donatur' },
    ];

    worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' }, // Black color
        };
        cell.font = {
            color: { argb: 'FFFFFFFF' }, // White color
            bold: true
        };
    });

    jurnal_data.forEach(row => {
        worksheet.addRow({
            nama: row.nama,
            no_hp: row.no_hp,
            tanggal: row.tanggal,
            tahun: row.tahun,
            zis: row.zis,
            via: row.via,
            sumber_dana: row.sumber_dana,
            nominal: row.nominal,
            jenis_donatur: row.jenis_donatur,
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return new Response(blob, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${jurnal.name}.xlsx"`
        }
    });
}