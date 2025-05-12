"use server";

import { Jurnal, JurnalData, JurnalDataCleaning } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { JurnalRow } from "@/lib/types";

// Helper function untuk extract tahun dari tanggal
function extractYearFromDate(dateString: string): number {
    if (!dateString) return 0;
    
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.getFullYear();
        }
        
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch && yearMatch[1]) {
            return parseInt(yearMatch[1]);
        }
        
        const parts = dateString.split(/[/\-.]/);
        if (parts.length >= 3) {
            for (const part of parts) {
                if (/^\d{4}$/.test(part)) {
                    return parseInt(part);
                }
            }
            const lastPart = parts[parts.length - 1];
            return parseInt(lastPart) > 50 ? 1900 + parseInt(lastPart) : 2000 + parseInt(lastPart);
        }
        
        return 0;
    } catch (e) {
        console.error('Error parsing date:', dateString, e);
        return 0;
    }
}

export async function GET(request: Request) {
    try {
        await Jurnal.sync();
        await JurnalData.sync();
        await JurnalDataCleaning.sync();

        const url = new URL(request.url);
        const params_id = url.searchParams.get('id');
        const include_cleaning = url.searchParams.get('include_cleaning') === 'true';
        const cleaning_only = url.searchParams.get('cleaning_only') === 'true';

        let res_jurnal: any = null;

        if (cleaning_only && params_id) {
            // Kasus khusus: hanya ambil data cleaning
            const cleaningData = await JurnalDataCleaning.findAll({
                where: { jurnal_id: params_id }
            });
            
            return new Response(JSON.stringify({
                status: 'success',
                data: cleaningData.map(d => d.get())
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (params_id) {
            const includeOptions = [JurnalData];
            
            if (include_cleaning) {
                includeOptions.push(JurnalDataCleaning);
            }

            const data = await Jurnal.findAll({
                where: { id: params_id },
                include: includeOptions
            });

            res_jurnal = data.length > 0 ? data[0].get() : null;
        } else {
            const includeOptions = include_cleaning 
                ? [JurnalData, JurnalDataCleaning] 
                : [JurnalData];

            const jurnalData = await Jurnal.findAll({ include: includeOptions });
            res_jurnal = jurnalData.map(j => j.get());
        }

        if (!res_jurnal) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Data not found'
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            status: 'success',
            data: res_jurnal
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('GET Error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { attachment_name, attachment_base64, jenisJurnal } = body;
        
        // Validasi input
        if (!attachment_name || !attachment_base64 || !jenisJurnal) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Missing required fields'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Proses file Excel
        const exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        await exceldata.xlsx.load(arrayBuffer);

        if (exceldata.worksheets.length === 0) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'No worksheet found'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const worksheet = exceldata.worksheets[0];
        const data = worksheet.getSheetValues();

        // Proses data Excel
        const expected_headers = ['no', 'tanggal', 'nama', 'telp/hp', 'donasi', 'via', 'keterangan'];
        const header_mapping: { [key: string]: string } = {
            'tanggal': 'tanggal',
            'keterangan': 'sumber_dana'
        };

        const header = data[5] as string[];
        if (!header || header.length === 0) {
            throw new Error('Header row not found or empty');
        }

        const header_index: { [key: string]: number } = {};
        const donation_columns: number[] = [];

        for (let i = 0; i < header.length; i++) {
            let header_name = header[i];
            if (header_name == undefined) continue;

            header_name = header_name.toLowerCase().trim();
            
            if (header_name.includes('donasi')) {
                donation_columns.push(i);
                header_index['donasi'] = i;
            } else {
                header_index[header_name] = i;
            }
        }

        for (const expected_header of expected_headers) {
            if (!(expected_header in header_index)) {
                header_index[expected_header] = -1;
            }
        }

        const row_data: KeyValue[] = [];
        for (let i = 7; i < data.length; i++) {
            const data_iter = data[i] as string[];
            if (!data_iter || data_iter.length === 0) continue;
            
            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    const donationValue = parseInt(data_iter[col] as string) || 0;
                    totalDonation += donationValue;
                }
            } else if (header_index['donasi'] !== -1) {
                totalDonation = parseInt(data_iter[header_index['donasi']] as string) || 0;
            }
            
            const row: KeyValue = {
                ['nama']: header_index['nama'] !== -1 ? data_iter[header_index['nama']]?.trim() || '' : '',
                ['no_hp']: header_index['telp/hp'] !== -1 ? data_iter[header_index['telp/hp']]?.trim() || '' : '',
                ['tanggal']: header_index['tangal'] !== -1 ? data_iter[header_index['tangal']] || '' : '',
                ['tahun']: header_index['tangal'] !== -1 ? extractYearFromDate(data_iter[header_index['tangal']]) : 0,
                ['zis']: '',
                ['via']: header_index['via'] !== -1 ? data_iter[header_index['via']]?.trim() || '' : '',
                ['sumber_dana']: header_index['keterangan'] !== -1 ? data_iter[header_index['keterangan']]?.trim() || '' : '',
                ['nominal']: totalDonation
            };

            row_data.push(row);
        }

        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);

        // Simpan ke database
        const res_jurnal = await Jurnal.create({
            name: attachment_name,
            jenisJurnal: jenisJurnal
        }) as unknown as JurnalRow;

        for (const row of classified_data) {
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

        // Panggil moveToCleaning untuk membersihkan data
        await moveToCleaning(res_jurnal.id);

        return new Response(JSON.stringify({
            status: 'success',
            data: {
                id: res_jurnal.id,
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('POST Error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to process request: ' + (error instanceof Error ? error.message : String(error))
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(request: Request) {
    try {
        const params_id = new URL(request.url).searchParams.get('id');
        if (!params_id) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Invalid parameter'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const is_exist = await Jurnal.findOne({ where: { id: params_id } });
        if (!is_exist) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Data not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await JurnalData.destroy({ where: { jurnal_id: params_id } });
        await JurnalDataCleaning.destroy({ where: { jurnal_id: params_id } });
        await Jurnal.destroy({ where: { id: params_id } });

        return new Response(JSON.stringify({
            status: 'success',
            message: 'Data deleted successfully'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('DELETE Error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to delete data'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function moveToCleaning(jurnalId: string) {
    try {
        if (!jurnalId) throw new Error('Journal ID is required');

        const journalExists = await Jurnal.findByPk(jurnalId);
        if (!journalExists) throw new Error('Journal not found');

        const originalData = await JurnalData.findAll({
            where: { jurnal_id: jurnalId },
            raw: true
        });

        if (!originalData || originalData.length === 0) {
            throw new Error('No data found to move');
        }

        // Gabungkan berdasarkan nomor HP
        const mergedDataMap: { [no_hp: string]: any } = {};

        for (const data of originalData) {
            const key = data.no_hp?.trim() || '';

            if (!key) continue;

            if (!mergedDataMap[key]) {
                mergedDataMap[key] = { ...data };
            } else {
                // Gabungkan nominal
                mergedDataMap[key].nominal += data.nominal;
                // Concatenate nama dan sumber_dana jika berbeda
                if (mergedDataMap[key].nama !== data.nama) {
                    mergedDataMap[key].nama += ` / ${data.nama}`;
                }
                if (mergedDataMap[key].sumber_dana !== data.sumber_dana) {
                    mergedDataMap[key].sumber_dana += ` / ${data.sumber_dana}`;
                }
            }
        }

        const cleaningData = Object.values(mergedDataMap).map((data: any) => ({
            jurnal_id: data.jurnal_id,
            nama: data.nama,
            no_hp: data.no_hp,
            tanggal: data.tanggal,
            tahun: data.tahun,
            zis: data.zis,
            via: data.via,
            sumber_dana: data.sumber_dana,
            nominal: data.nominal,
            jenis_donatur: data.jenis_donatur,
            cleaned: false,
            notes: '',
            created_at: new Date(),
            updated_at: new Date()
        }));

        const result = await JurnalDataCleaning.bulkCreate(cleaningData);

        return {
            status: 'success',
            message: `Successfully moved ${result.length} merged records to cleaning table`,
            count: result.length
        };

    } catch (error) {
        console.error('Error in moveToCleaning:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to move data to cleaning table'
        };
    }
}
