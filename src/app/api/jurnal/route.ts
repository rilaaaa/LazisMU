"use server";

import { Jurnal, JurnalData, JurnalDataCleaning, Database } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { parse } from 'date-fns';

function parseAndValidateDate(dateString: string): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;

    const formats = [
        'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd',
        'dd-MM-yyyy', 'MM-dd-yyyy'
    ];

    for (const format of formats) {
        try {
            const parsed = parse(dateString, format, new Date());
            if (!isNaN(parsed.getTime())) return parsed;
        } catch {}
    }

    return new Date();
}

function parseNominal(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function normalizePhoneNumber(no_hp: string): string {
    if (!no_hp) return '';
    const cleaned = no_hp.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
    if (cleaned.startsWith('620')) return '62' + cleaned.substring(3);
    if (cleaned.startsWith('62')) return cleaned;
    if (cleaned.startsWith('8')) return '62' + cleaned;
    return cleaned;
}

export async function GET(request: Request) {
    try {
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

        const includeOptions = [JurnalData];
        if (include_cleaning) includeOptions.push(JurnalDataCleaning);

        if (params_id) {
            const data = await Jurnal.findAll({ where: { id: params_id }, include: includeOptions });
            res_jurnal = data.length > 0 ? data[0].get() : null;
            if (res_jurnal && include_cleaning) res_jurnal.JurnalDataCleanings = res_jurnal.JurnalDataCleanings || [];
        } else {
            const data = await Jurnal.findAll({ include: includeOptions });
            res_jurnal = data.map(j => {
                const journal = j.get();
                if (include_cleaning) journal.JurnalDataCleanings = journal.JurnalDataCleanings || [];
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
        return new Response(JSON.stringify({ status: 'error', message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: Request) {
    const transaction = await Database.transaction();

    try {
        const body = await request.json();
        const { attachment_name, attachment_base64, jenisJurnal } = body;

        if (!attachment_name || !attachment_base64 || !jenisJurnal) {
            await transaction.rollback();
            return new Response(JSON.stringify({ status: 'error', message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const workbook = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        const data = worksheet.getSheetValues();

        const header = data[1] as string[];
        const header_index: { [key: string]: number } = {};
        const donation_columns: number[] = [];

        for (let i = 0; i < header.length; i++) {
            let name = header[i]?.toLowerCase().trim();
            if (!name) continue;
            if (name.includes('donasi') || name.includes('nominal')) {
                donation_columns.push(i);
                header_index['nominal'] = i;
            } else {
                header_index[name] = i;
            }
        }

        const row_data: KeyValue[] = [];
        for (let i = 2; i < data.length; i++) {
            const row = data[i] as string[];
            if (!row) continue;

            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    totalDonation += parseNominal(row[col]);
                }
            } else {
                totalDonation = parseNominal(row[header_index['nominal']]);
            }

            const parsedDate = parseAndValidateDate(row[header_index['tanggal']] || '');

            row_data.push({
                nama: row[header_index['nama']] || '',
                no_hp: normalizePhoneNumber(row[header_index['no hp']] || ''),
                tanggal: parsedDate,
                tahun: parsedDate.getFullYear(),
                zis: '',
                via: row[header_index['via']] || '',
                sumber_dana: row[header_index['keterangan']] || '',
                nominal: totalDonation,
                kategori: row[header_index['kategori']] || ''
            });
        }

        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);

        const res_jurnal = await Jurnal.create({ name: attachment_name, jenisJurnal }, { transaction });

        const jurnalDataRecords = classified_data.map(row => ({
            jurnal_id: res_jurnal.id,
            nama: row.nama,
            no_hp: row.no_hp,
            tanggal: row.tanggal,
            tahun: row.tahun,
            zis: row.zis,
            via: row.via,
            sumber_dana: row.sumber_dana,
            nominal: row.nominal,
            jenis_donatur: row.jenis_donatur,
            kategori: row.kategori || ''
        }));

        await JurnalData.bulkCreate(jurnalDataRecords, { transaction });
        await moveToCleaning(res_jurnal.id, transaction);

        await transaction.commit();

        return new Response(JSON.stringify({ 
            status: 'success', 
            data: { id: res_jurnal.id, recordCount: classified_data.length } 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        await transaction.rollback();
        return new Response(JSON.stringify({ status: 'error', message: 'Processing error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = parseInt(url.searchParams.get('id') || '', 10);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ status: 'error', message: 'Invalid ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await JurnalData.destroy({ where: { jurnal_id: id } });
        await JurnalDataCleaning.destroy({ where: { jurnal_id: id } });
        await Jurnal.destroy({ where: { id } });

        return new Response(JSON.stringify({ status: 'success', message: 'Jurnal deleted successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ status: 'error', message: 'Failed to delete jurnal' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function moveToCleaning(jurnalId: string, transaction?: any) {
    const options = transaction ? { transaction } : {};
    const allData = await JurnalData.findAll({ raw: true, ...options });

    const grouped: { [no_hp: string]: any[] } = {};
    for (const entry of allData) {
        const phone = normalizePhoneNumber(entry.no_hp || '');
        if (!phone || phone === '62') continue;
        grouped[phone] = grouped[phone] || [];
        grouped[phone].push(entry);
    }

    const classifier = new DonationClassifier();
    const result: any[] = [];

    for (const [no_hp, entries] of Object.entries(grouped)) {
        const sorted = entries.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        const latest = sorted[0];
        if (!latest || latest.jurnal_id !== jurnalId) continue;

        const related = entries.filter(e => new Date(e.tanggal).getTime() <= new Date(latest.tanggal).getTime());
        const valid = related.filter(e => e.nominal && e.nominal > 0);

        const total = valid.reduce((sum, e) => sum + e.nominal, 0);
        const avgNominal = valid.length ? Math.round(total / valid.length) : 0;

        const nama = related.map(e => e.nama).reduce((a, b) => b.length > a.length ? b : a, '');
        const sumber = related.map(e => e.sumber_dana).filter(Boolean).join(' / ');
        const kategori = latest.kategori || 'Tidak Diketahui';

        const c1 = classifier.kategori_muzaki({ ...latest, kategori });
        const c2 = valid.length >= 3 ? 'Sering' : 'Jarang';
        const jenis_donatur = kategori === 'Momentum' ? 'Momentum' : (valid.length === 1 ? 'Calon' : `${c1} ${c2}`);

        result.push({
            jurnal_id: jurnalId,
            nama: nama || latest.nama || '',
            no_hp,
            tanggal: latest.tanggal,
            tahun: latest.tahun,
            zis: latest.zis || '',
            via: latest.via || '',
            sumber_dana: sumber || latest.sumber_dana || '',
            nominal: avgNominal,
            jenis_donatur,
            kategori,
            created_at: new Date(),
            updated_at: new Date()
        });
    }

    const noHpList = result.map(r => r.no_hp);
    if (noHpList.length > 0) {
        await JurnalDataCleaning.destroy({ where: { no_hp: noHpList }, ...options });
    }

    if (result.length > 0) {
        await JurnalDataCleaning.bulkCreate(result, { ...options, validate: true });
    }
}