

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
    
    // Try parsing as ISO date first
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    
    // Try common date formats with correct tokens
    const formats = [
        'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd',
        'dd-MM-yyyy', 'MM-dd-yyyy'
    ];
    
    for (const format of formats) {
        try {
            const parsed = parse(dateString, format, new Date());
            if (!isNaN(parsed.getTime())) return parsed;
        } catch (e) {
            console.warn(`Failed to parse date ${dateString} with format ${format}`);
        }
    }
    
    console.warn(`Could not parse date: ${dateString}, using current date as fallback`);
    return new Date(); // Fallback to current date
}

function extractYearFromDate(dateString: string): number {
    if (!dateString) return 0;
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date.getFullYear();
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch && yearMatch[1]) return parseInt(yearMatch[1]);
        const parts = dateString.split(/[/.-]/);
        if (parts.length >= 3) {
            for (const part of parts) {
                if (/^\d{4}$/.test(part)) return parseInt(part);
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

function normalizePhoneNumber(no_hp: string): string {
    if (!no_hp) return '';
    const cleaned = no_hp.replace(/[\s\-]/g, '');
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }
    return cleaned;
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

        if (cleaning_only) {
            if (params_id) {
                // Logika Anda yang sudah ada untuk mengambil data cleaning berdasarkan ID
                const cleaningData = await JurnalDataCleaning.findAll({ where: { jurnal_id: params_id } });
                const formattedResponse = {
                    id: params_id,
                    JurnalData: [],
                    JurnalDataCleanings: cleaningData.map(d => d.get())
                };
                return new Response(JSON.stringify({ status: 'success', data: formattedResponse }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                // ---- INI ADALAH BLOK YANG DITAMBAHKAN ----
                // Mengambil SEMUA data dari JurnalDataCleanings untuk dashboard
                const allCleaningData = await JurnalDataCleaning.findAll();
                return new Response(JSON.stringify({ status: 'success', data: allCleaningData }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Sisa dari logika GET Anda untuk Jurnal Umum (tidak diubah)
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
        const expected_headers = ['no', 'tangal', 'nama', 'telp/hp', 'donasi', 'via', 'keterangan'];
        const header = data[5] as string[];
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
            if (!row) continue;

            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    totalDonation += parseInt(row[col] as string) || 0;
                }
            } else if (header_index['donasi'] !== -1) {
                totalDonation = parseInt(row[header_index['donasi']] as string) || 0;
            }

            const rawDate = header_index['tangal'] !== -1 ? row[header_index['tangal']] || '' : '';
            const parsedDate = parseAndValidateDate(rawDate);

            row_data.push({
                nama: header_index['nama'] !== -1 ? row[header_index['nama']]?.trim() || '' : '',
                no_hp: header_index['telp/hp'] !== -1 ? normalizePhoneNumber(row[header_index['telp/hp']]?.trim() || '') : '',
                tanggal: parsedDate || new Date(),
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
        
        const journalExists = await Jurnal.findByPk(jurnalId, options);
        if (!journalExists) throw new Error('Journal not found');

        const newData = await JurnalData.findAll({ 
            where: { jurnal_id: jurnalId }, 
            raw: true,
            ...options
        });

        const oldCleanedData = await JurnalDataCleaning.findAll({ 
            where: { jurnal_id: { [Op.not]: jurnalId } }, 
            raw: true,
            ...options
        });

        const combinedData = [...newData, ...oldCleanedData];

        const groupedData: { [no_hp: string]: any[] } = {};
        for (const data of combinedData) {
            const key = normalizePhoneNumber(data.no_hp?.trim() || '');
            if (!key) continue;
            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(data);
        }

        const cleaningData = Object.entries(groupedData).map(([no_hp, entries]) => {
            const totalNominal = entries.reduce((sum, e) => sum + (e.nominal || 0), 0);
            const avgNominal = Math.round(totalNominal / entries.length);
            const longestNama = entries.reduce((longest, e) => 
                (e.nama?.length || 0) > (longest?.length || 0) ? e.nama : longest, '');
            const combinedSumberDana = [...new Set(entries.map(e => e.sumber_dana))].join(' / ');
            const ref = entries[0];

            return {
                jurnal_id: jurnalId,
                nama: longestNama,
                no_hp: normalizePhoneNumber(no_hp),
                tanggal: ref.tanggal,
                tahun: ref.tahun,
                zis: ref.zis,
                via: ref.via,
                sumber_dana: combinedSumberDana,
                nominal: avgNominal,
                jenis_donatur: ref.jenis_donatur,
                cleaned: false,
                notes: '',
                created_at: new Date(),
                updated_at: new Date()
            };
        });

        await JurnalDataCleaning.destroy({ 
            where: { jurnal_id: jurnalId },
            ...options
        });

        const result = await JurnalDataCleaning.bulkCreate(cleaningData, options);

        return { 
            status: 'success', 
            message: `Successfully merged ${result.length} records`, 
            count: result.length 
        };
    } catch (error) {
        console.error('Error in moveToCleaning:', error);
        throw error;
    }
}