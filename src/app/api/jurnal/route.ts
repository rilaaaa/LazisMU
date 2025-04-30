"use server";

import { Jurnal, JurnalData } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { JurnalRow } from "@/lib/types";

export async function GET(
    request: Request,
) {
    await Jurnal.sync();

    const params_id = new URL(request.url).searchParams.get('id');
    let res_jurnal: JurnalRow | JurnalRow[] | null = null;

    if (params_id) {
        const data = await Jurnal.findAll({
            where: {
                id: params_id
            },
            include: [JurnalData]
        });

        if (data.length == 0) {
            res_jurnal = null;
        } else {
            res_jurnal = data[0].get();
        }
    }
    else {
        const jurnalData = await Jurnal.findAll();
        res_jurnal = jurnalData.map(j => j.get()) as JurnalRow[];
    }

    if (res_jurnal == null) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Data not found'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    return new Response(JSON.stringify({
        status: 'success',
        data: res_jurnal
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export async function POST(
    request: Request,
) {
    const body = await request.json();
    const { attachment_name, attachment_base64 } = body;
    let exceldata;

    try {
        exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        await exceldata.xlsx.load(arrayBuffer);
    } catch {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Invalid excel file'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    if (exceldata.worksheets.length == 0) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'No worksheet found'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        const worksheet = exceldata.worksheets[0];
        const data = worksheet.getSheetValues();

        const expected_headers = ['tanggal', 'tahun', 'zis', 'via', 'sumber dana', 'nama', 'donasi', 'no'];
        // let is_header_missing = false;
        // const missing_headers: string[] = [];

        const header = data[1] as string[];
        const header_index: { [key: string]: number } = {};

        // Normalize and map header positions
        for (let i = 1; i <= header.length; i++) {
            let header_name = header[i];
            if (header_name == undefined) {
                continue;
            }

            header_name = header_name.toLowerCase().trim();
            header_index[header_name] = i;
        }

        // Check for missing headers and set to -1 in header_index if missing
        for (const expected_header of expected_headers) {
            if (!(expected_header in header_index)) {
                // is_header_missing = true;
                // missing_headers.push(expected_header);
                header_index[expected_header] = -1; // Set to -1 if header is missing
            }
        }

        const row_data: KeyValue[] = [];
        for (let i = 2; i < data.length; i++) {
            const data_iter = data[i] as string[];
            const tahun = header_index['tahun'] !== -1 ? parseInt(data_iter[header_index['tahun']]) : 0;
            const nominal = header_index['donasi'] !== -1 ? parseInt(data_iter[header_index['donasi']]) : 0;

            const no_hp_key = ['no hp', 'nomor hp', 'hp'].find(key => key in header_index) || '';
            const row: KeyValue = {
                ['nama']: header_index['nama'] !== -1 ? data_iter[header_index['nama']]?.trim() || '' : '',
                ['no_hp']: header_index[no_hp_key] !== -1 ? data_iter[header_index[no_hp_key]] || '' : '',
                ['tanggal']: header_index['tanggal'] !== -1 ? data_iter[header_index['tanggal']] || '' : '',
                ['tahun']: tahun || 0,
                ['zis']: header_index['zis'] !== -1 ? data_iter[header_index['zis']]?.trim() || '' : '',
                ['via']: header_index['via'] !== -1 ? data_iter[header_index['via']]?.trim() || '' : '',
                ['sumber_dana']: header_index['sumber dana'] !== -1 ? data_iter[header_index['sumber dana']]?.trim() || '' : '',
                ['nominal']: nominal || 0
            };

            row_data.push(row)
        }

        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);

        const res_jurnal = await Jurnal.create({
            'name': attachment_name
        }) as unknown as JurnalRow;

        // Insert to database
        for (let i = 0; i < classified_data.length; i++) {
            const row = classified_data[i];
            await JurnalData.create({
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
        }

        return new Response(JSON.stringify({
            status: 'success',
            data: {
                id: res_jurnal.id,
            }
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log(error);

        return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to upload data'
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function DELETE(
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

    try {
        const is_exist = await Jurnal.findOne({
            where: {
                id: params_id
            }
        });

        if (!is_exist) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Data not found'
            }), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // delete jurnal, but wtih jurnaldata too
        await Jurnal.destroy({
            where: {
                id: params_id
            }
        });

        await JurnalData.destroy({
            where: {
                jurnal_id: params_id
            }
        });

        return new Response(JSON.stringify({
            status: 'success',
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error(error)

        return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to delete data'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}