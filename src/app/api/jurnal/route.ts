"use server";

import { Jurnal, JurnalData, JurnalDataCleaning } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { JurnalRow } from "@/lib/types";
import { moveToCleaning } from "../../../components/journalCleaning";

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

        if (cleaning_only && params_id) {
            const cleaningData = await JurnalDataCleaning.findAll({ where: { jurnal_id: params_id } });
            const formattedResponse = {
                id: params_id,
                JurnalData: [],
                JurnalDataCleanings: cleaningData.map(d => d.get())
            };
            return new Response(JSON.stringify({ status: 'success', data: formattedResponse }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let res_jurnal: any = null;

        if (params_id) {
            const includeOptions = [JurnalData];
            if (include_cleaning) includeOptions.push(JurnalDataCleaning);
            const data = await Jurnal.findAll({ where: { id: params_id }, include: includeOptions });
            res_jurnal = data.length > 0 ? data[0].get() : null;
            if (res_jurnal && include_cleaning) {
                res_jurnal.JurnalDataCleanings = res_jurnal.JurnalDataCleanings || [];
            }
        } else {
            const includeOptions = include_cleaning ? [JurnalData, JurnalDataCleaning] : [JurnalData];
            const jurnalData = await Jurnal.findAll({ include: includeOptions });
            res_jurnal = jurnalData.map(j => {
                const journal = j.get();
                if (include_cleaning) {
                    journal.JurnalDataCleanings = journal.JurnalDataCleanings || [];
                }
                return journal;
            });
        }

        if (!res_jurnal) {
            return new Response(JSON.stringify({ status: 'error', message: 'Data not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ status: 'success', data: res_jurnal }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('GET Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { attachment_name, attachment_base64, jenisJurnal } = body;
        if (!attachment_name || !attachment_base64 || !jenisJurnal) {
            return new Response(JSON.stringify({ status: 'error', message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const workbook = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        await workbook.xlsx.load(arrayBuffer);

        if (workbook.worksheets.length === 0) {
            return new Response(JSON.stringify({ status: 'error', message: 'No worksheet found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const worksheet = workbook.worksheets[0];
        const data = worksheet.getSheetValues();

        const expected_headers = ['no', 'tanggal', 'nama', 'telp/hp', 'donasi', 'via', 'keterangan'];
        const header = data[5] as string[];
        if (!header || header.length === 0) throw new Error('Header row not found or empty');

        const header_index: { [key: string]: number } = {};
        const donation_columns: number[] = [];

        for (let i = 0; i < header.length; i++) {
            let header_name = header[i];
            if (!header_name) continue;
            header_name = header_name.toLowerCase().trim();
            if (header_name.includes('donasi')) {
                donation_columns.push(i);
                header_index['donasi'] = i;
            } else {
                header_index[header_name] = i;
            }
        }

        for (const expected of expected_headers) {
            if (!(expected in header_index)) header_index[expected] = -1;
        }

        const row_data: KeyValue[] = [];
        for (let i = 7; i < data.length; i++) {
            const row = data[i] as string[];
            if (!row || row.length === 0) continue;
            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    totalDonation += parseInt(row[col] as string) || 0;
                }
            } else if (header_index['donasi'] !== -1) {
                totalDonation = parseInt(row[header_index['donasi']] as string) || 0;
            }
            const tanggalValue = header_index['tanggal'] !== -1 ? row[header_index['tanggal']] : '';
            row_data.push({
                nama: header_index['nama'] !== -1 ? row[header_index['nama']]?.trim() || '' : '',
                no_hp: header_index['telp/hp'] !== -1 ? row[header_index['telp/hp']]?.trim() || '' : '',
                tanggal: tanggalValue || '',
                tahun: extractYearFromDate(tanggalValue),
                zis: '',
                via: header_index['via'] !== -1 ? row[header_index['via']]?.trim() || '' : '',
                sumber_dana: header_index['keterangan'] !== -1 ? row[header_index['keterangan']]?.trim() || '' : '',
                nominal: totalDonation
            });
        }

        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);
        const res_jurnal = await Jurnal.create({ name: attachment_name, jenisJurnal }) as unknown as JurnalRow;

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

        await moveToCleaning(res_jurnal.id);

        return new Response(JSON.stringify({ status: 'success', data: { id: res_jurnal.id } }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('POST Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Failed to process request: ' + (error instanceof Error ? error.message : String(error)) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(request: Request) {
    try {
        const params_id = new URL(request.url).searchParams.get('id');
        if (!params_id) {
            return new Response(JSON.stringify({ status: 'error', message: 'Invalid parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const is_exist = await Jurnal.findOne({ where: { id: params_id } });
        if (!is_exist) {
            return new Response(JSON.stringify({ status: 'error', message: 'Data not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await JurnalData.destroy({ where: { jurnal_id: params_id } });
        await JurnalDataCleaning.destroy({ where: { jurnal_id: params_id } });
        await Jurnal.destroy({ where: { id: params_id } });

        return new Response(JSON.stringify({ status: 'success', message: 'Data deleted successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('DELETE Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
