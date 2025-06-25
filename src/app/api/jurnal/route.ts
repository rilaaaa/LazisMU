"use server";

import { Jurnal, JurnalData, JurnalDataCleaning, Database } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { JurnalRow } from "@/lib/types";
import { Op } from "sequelize";
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
        } catch (error) {
            console.warn(`Failed to parse date ${dateString} with format ${format}`);
        }
    }
    
    console.warn(`Could not parse date: ${dateString}, using current date as fallback`);
    return new Date(); // Fallback to current date
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
            const data = await Jurnal.findAll({ 
                where: { id: params_id }, 
                include: includeOptions 
            });
            res_jurnal = data.length > 0 ? data[0].get() : null;
            if (res_jurnal && include_cleaning) res_jurnal.JurnalDataCleanings = res_jurnal.JurnalDataCleanings || [];
        } else {
            const includeOptions = include_cleaning ? [JurnalData, JurnalDataCleaning] : [JurnalData];
            const jurnalData = await Jurnal.findAll({ include: includeOptions });
            res_jurnal = jurnalData.map(j => {
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
        console.error('GET Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function parseNominal(value: any): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }

    if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    try {
        return parseFloat(String(value)) || 0;
    } catch {
        return 0;
    }
}

function normalizePhoneNumber(no_hp: string): string {
    if (!no_hp) return '';
    const cleaned = no_hp.replace(/[\s\-]/g, '');
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }
    return cleaned;
}

export async function POST(request: Request) {
    if (!Database) {
        console.error('Sequelize not initialized');
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: 'Database connection not established' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

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

        const exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        await exceldata.xlsx.load(arrayBuffer);

        if (exceldata.worksheets.length === 0) {
            await transaction.rollback();
            return new Response(JSON.stringify({ status: 'error', message: 'No worksheet found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const worksheet = exceldata.worksheets[0];
        const data = worksheet.getSheetValues();
        const expected_headers = ['no', 'tanggal', 'nama', 'no hp', 'kategori', 'nominal', 'via', 'keterangan'];
        const header = data[1] as string[];
        const header_index: { [key: string]: number } = {};
        const donation_columns: number[] = [];

        for (let i = 0; i < header.length; i++) {
            let header_name = header[i];
            if (!header_name) continue;

            header_name = header_name.toLowerCase().trim();

            if (header_name.includes('donasi') || header_name.includes('nominal')) {
                donation_columns.push(i);
                header_index['nominal'] = i;
            } else {
                header_index[header_name] = i;
            }
        }

        for (const expected of expected_headers) {
            if (!(expected in header_index)) header_index[expected] = -1;
        }

        const row_data: KeyValue[] = [];
        for (let i = 2; i < data.length; i++) {
            const row = data[i] as string[];
            if (!row) continue;

            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    const value = row[col];
                    totalDonation += parseNominal(value);
                }
            } else if (header_index['nominal'] !== -1) {
                totalDonation = parseNominal(row[header_index['nominal']]);
            }

            const rawDate = header_index['tanggal'] !== -1 ? row[header_index['tanggal']] || '' : '';
            const parsedDate = parseAndValidateDate(rawDate);

            row_data.push({
                nama: header_index['nama'] !== -1 ? row[header_index['nama']]?.trim() || '' : '',
                no_hp: header_index['no hp'] !== -1 ? normalizePhoneNumber(row[header_index['no hp']]?.trim() || '') : '',
                tanggal: parsedDate || new Date(), // Fallback to current date if invalid
                tahun: parsedDate ? parsedDate.getFullYear() : new Date().getFullYear(),
                zis: '',
                via: header_index['via'] !== -1 ? row[header_index['via']]?.trim() || '' : '',
                sumber_dana: header_index['keterangan'] !== -1 ? row[header_index['keterangan']]?.trim() || '' : '',
                nominal: totalDonation
            });
        }

        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);
        
        const res_jurnal = await Jurnal.create({
            name: attachment_name,
            jenisJurnal
        }, { transaction });

        if (!res_jurnal || !res_jurnal.id) {
            await transaction.rollback();
            throw new Error('Failed to create journal record');
        }

        const jurnalDataRecords = classified_data.map(row => ({
            jurnal_id: res_jurnal.id,
            nama: row.nama,
            no_hp: row.no_hp,
            tanggal: row.tanggal || new Date(),
            tahun: row.tahun,
            zis: row.zis,
            via: row.via,
            sumber_dana: row.sumber_dana,
            nominal: row.nominal,
            jenis_donatur: row.jenis_donatur
        }));

        await JurnalData.bulkCreate(jurnalDataRecords, { transaction });

        // Move to cleaning - Ensure existing cleaning data is preserved
        await moveToCleaning(res_jurnal.id, transaction);

        await transaction.commit();

        return new Response(JSON.stringify({ 
            status: 'success', 
            data: { 
                id: res_jurnal.id,
                recordCount: classified_data.length
            } 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        await transaction.rollback();
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
    const transaction = await Database.transaction();
    
    try {
        const params_id = new URL(request.url).searchParams.get('id');
        if (!params_id) {
            await transaction.rollback();
            return new Response(JSON.stringify({ status: 'error', message: 'Invalid parameter' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const is_exist = await Jurnal.findOne({ 
            where: { id: params_id },
            transaction
        });
        
        if (!is_exist) {
            await transaction.rollback();
            return new Response(JSON.stringify({ status: 'error', message: 'Data not found' }), { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        await JurnalData.destroy({ 
            where: { jurnal_id: params_id },
            transaction
        });
        
        await JurnalDataCleaning.destroy({ 
            where: { jurnal_id: params_id },
            transaction
        });
        
        await Jurnal.destroy({ 
            where: { id: params_id },
            transaction
        });

        await transaction.commit();

        return new Response(JSON.stringify({ 
            status: 'success', 
            message: 'Data deleted successfully' 
        }), { 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        await transaction.rollback();
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

async function moveToCleaning(jurnalId: string, transaction?: any) {
  try {
    if (!jurnalId) throw new Error('Journal ID is required');
    const options = transaction ? { transaction } : {};

    const allData = await JurnalData.findAll({ raw: true, ...options });

    function normalizePhoneNumber(phone: string): string {
      phone = phone.replace(/\D/g, '');
      if (phone.startsWith('0')) return '62' + phone.slice(1);
      if (phone.startsWith('620')) return '62' + phone.slice(3);
      if (phone.startsWith('62')) return phone;
      if (phone.startsWith('8')) return '62' + phone;
      return phone;
    }

    const grouped: { [no_hp: string]: any[] } = {};
    for (const entry of allData) {
      const phone = normalizePhoneNumber(entry.no_hp || '');
      if (!phone || phone === '62') continue;
      if (!grouped[phone]) grouped[phone] = [];
      grouped[phone].push(entry);
    }

    const classifier = new DonationClassifier();
    const result: any[] = [];

    for (const [no_hp, entries] of Object.entries(grouped)) {
      const sorted = entries
        .filter(e => e.tanggal)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const latest = sorted[0];
      if (!latest || latest.jurnal_id !== jurnalId) continue;

      const relatedEntries = entries.filter(e =>
        e.tanggal && new Date(e.tanggal).getTime() <= new Date(latest.tanggal).getTime()
      );

      const validEntries = relatedEntries.filter(e => e.nominal && e.nominal > 0);
      const totalNominal = validEntries.reduce((sum, e) => sum + e.nominal, 0);
      const avgNominal = validEntries.length ? Math.round(totalNominal / validEntries.length) : 0;

      const namaTerpanjang = relatedEntries
        .map(e => e.nama?.trim())
        .filter(Boolean)
        .reduce((a, b) => (b.length > a.length ? b : a), '');

      const sumberGabungan = relatedEntries
        .map(e => e.sumber_dana?.trim())
        .filter(Boolean)
        .join(' / ');

      const sumberTerakhir = (latest.sumber_dana || '').toLowerCase().trim();
      let kategori = 'Tidak Diketahui';
      if (sumberTerakhir.includes('zakat')) kategori = 'Zakat';
      else if (sumberTerakhir.includes('infaq')) kategori = 'Infaq';
      else if (sumberTerakhir.includes('donasi')) kategori = 'Momentum';

      const c1 = classifier.kategori_muzaki({ ...latest, kategori });
      const c2 = (kategori === 'Zakat' && validEntries.length >= 3) ||
                 (kategori === 'Infaq' && validEntries.length >= 3) ? 'Sering' : 'Jarang';

      const jenis_donatur = (kategori === 'Momentum')
        ? 'Momentum'
        : validEntries.length === 1 ? 'Calon' : `${c1} ${c2}`;

      result.push({
        jurnal_id: jurnalId,
        nama: namaTerpanjang || latest.nama || '',
        no_hp,
        tanggal: latest.tanggal || new Date(),
        tahun: latest.tahun || new Date().getFullYear(),
        zis: latest.zis || '',
        via: latest.via || '',
        sumber_dana: sumberGabungan || latest.sumber_dana || '',
        nominal: avgNominal,
        jenis_donatur,
        cleaned: false,
        notes: `Rata-rata dari ${validEntries.length} transaksi gabungan`,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // ✨ HAPUS semua entry cleaning sebelumnya dari no_hp yang sama
    const noHpList = result.map(r => r.no_hp);
    if (noHpList.length > 0) {
      await JurnalDataCleaning.destroy({
        where: { no_hp: noHpList },
        ...options,
      });
    }

    // ✅ Insert hasil terbaru
    if (result.length > 0) {
      await JurnalDataCleaning.bulkCreate(result, {
        ...options,
        validate: true
      });
    }

    return {
      status: 'success',
      message: `Cleaned ${result.length} donatur. Entry lama yang bentrok sudah dihapus.`,
      count: result.length
    };

  } catch (err) {
    console.error('❌ Error in moveToCleaning:', err);
    throw new Error('Gagal membersihkan data: ' + (err instanceof Error ? err.message : String(err)));
  }
}
