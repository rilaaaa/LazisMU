// D:\Semester_6\kepin\new\LazisMU-maintenance_lintang\LazisMU-maintenance_lintang\src\app\api\jurnal\route.ts

"use server";

import { Jurnal, JurnalData, JurnalDataCleaning, JurnalDataPenyaluran, Database } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { DonationClassifier, KeyValue } from "./classifikasi";
import { Op } from "sequelize";
import { parse } from 'date-fns';
import { NextResponse } from "next/server"; // Direkomendasikan untuk respons API

// ========================================================================
// === FUNGSI HELPER ANDA (TIDAK DIUBAH) ===
// ========================================================================

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

// ========================================================================
// === FUNGSI GET (TIDAK DIUBAH) ===
// ========================================================================

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const params_id = url.searchParams.get('id');
        const cleaning_only = url.searchParams.get('cleaning_only') === 'true';

        if (cleaning_only) {
            if (params_id) {
                const cleaningData = await JurnalDataCleaning.findAll({ where: { jurnal_id: params_id } });
                const formattedResponse = {
                    id: params_id,
                    JurnalData: [],
                    JurnalDataCleanings: cleaningData.map(d => d.get())
                };
                return NextResponse.json({ status: 'success', data: formattedResponse });
            } else {
                const allCleaningData = await JurnalDataCleaning.findAll();
                return NextResponse.json({ status: 'success', data: allCleaningData });
            }
        }

        let responseData;
        if (params_id) {
            responseData = await Jurnal.findOne({
                where: { id: params_id },
                include: [
                    { model: JurnalData, required: false },
                    { model: JurnalDataPenyaluran, required: false }
                ]
            });
            if (!responseData) {
                return NextResponse.json({ status: 'error', message: 'Data Jurnal tidak ditemukan' }, { status: 404 });
            }
        } else {
            responseData = await Jurnal.findAll({ order: [['createdAt', 'DESC']] });
        }

        return NextResponse.json({ status: 'success', data: responseData });

    } catch (error) {
        console.error('GET Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
    }
}

// ========================================================================
// === FUNGSI POST (TIDAK DIUBAH) ===
// ========================================================================

export async function POST(request: Request) {
    if (!Database) {
        return NextResponse.json({ status: 'error', message: 'Database connection not established' }, { status: 500 });
    }

    const transaction = await Database.transaction();
    
    try {
        const body = await request.json();
        const { attachment_name, attachment_base64, jenisJurnal } = body;

        if (!attachment_name || !attachment_base64 || !jenisJurnal) {
            await transaction.rollback();
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        const exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        await exceldata.xlsx.load(arrayBuffer);

        if (exceldata.worksheets.length === 0) {
            await transaction.rollback();
            return NextResponse.json({ status: 'error', message: 'No worksheet found' }, { status: 400 });
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
                for (const col of donation_columns) { totalDonation += parseInt(row[col] as string) || 0; }
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
            nama: row.nama, no_hp: row.no_hp, tanggal: row.tanggal || new Date(),
            tahun: row.tahun, zis: row.zis, via: row.via, sumber_dana: row.sumber_dana,
            nominal: row.nominal, jenis_donatur: row.jenis_donatur
        }));

        await JurnalData.bulkCreate(jurnalDataRecords, { transaction });
        await moveToCleaning(res_jurnal.id, transaction);
        await transaction.commit();

        return NextResponse.json({ 
            status: 'success', 
            data: { id: res_jurnal.id, recordCount: classified_data.length } 
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
           await transaction.rollback();
        }
        console.error('POST Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ status: 'error', message: 'Failed to process request: ' + errorMessage }, { status: 500 });
    }
}

// ========================================================================
// === FUNGSI DELETE (TIDAK DIUBAH) ===
// ========================================================================

export async function DELETE(request: Request) {
    const transaction = await Database.transaction();
    
    try {
        const id = new URL(request.url).searchParams.get('id');
        if (!id) {
            await transaction.rollback();
            return NextResponse.json({ status: 'error', message: 'Parameter ID wajib diisi' }, { status: 400 });
        }

        const jurnalToDelete = await Jurnal.findByPk(id, { transaction });
        
        if (!jurnalToDelete) {
            await transaction.rollback();
            return NextResponse.json({ status: 'error', message: `Data Jurnal dengan ID ${id} tidak ditemukan` }, { status: 404 });
        }

        await JurnalData.destroy({ where: { jurnal_id: id }, transaction });
        await JurnalDataCleaning.destroy({ where: { jurnal_id: id }, transaction });
        await JurnalDataPenyaluran.destroy({ where: { jurnal_id: id }, transaction });
        await Jurnal.destroy({ where: { id: id }, transaction });

        await transaction.commit();

        return NextResponse.json({ 
            status: 'success', 
            message: `Data Jurnal dengan ID ${id} berhasil dihapus` 
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
           await transaction.rollback();
        }
        console.error('DELETE Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ status: 'error', message: 'Gagal menghapus data: ' + errorMessage }, { status: 500 });
    }
}

// ========================================================================
// === FUNGSI moveToCleaning (HANYA BAGIAN INI YANG DIUBAH) ===
// ========================================================================

async function moveToCleaning(jurnalId: string, transaction?: any) {
    try {
        if (!jurnalId) throw new Error('Journal ID is required');
        
        const options = transaction ? { transaction } : {};
        
        // Pastikan Jurnal induknya ada
        const journalExists = await Jurnal.findByPk(jurnalId, options);
        if (!journalExists) throw new Error(`Journal with ID ${jurnalId} not found`);

        // 1. Ambil HANYA data mentah yang baru saja diunggah untuk jurnalId ini
        const newData = await JurnalData.findAll({ 
            where: { jurnal_id: jurnalId }, 
            raw: true,
            ...options
        });

        if (newData.length === 0) {
            console.warn(`No raw data found for journal ID ${jurnalId}. Nothing to move to cleaning.`);
            return { status: 'success', message: 'No data to process for cleaning.', count: 0 };
        }

        // 2. Kelompokkan data BARU ini berdasarkan nomor HP
        const groupedData: { [no_hp: string]: any[] } = {};
        for (const data of newData) {
            const key = data.no_hp?.trim() || ''; 
            if (!key) continue;
            
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(data);
        }

        // 3. Proses data yang sudah dikelompokkan menjadi data 'cleaning'
        const cleaningData = Object.entries(groupedData).map(([no_hp, entries]) => {
            const totalNominal = entries.reduce((sum, e) => sum + (e.nominal || 0), 0);
            const longestNama = entries.reduce((longest, e) => 
                (e.nama?.length || 0) > (longest?.length || 0) ? e.nama : longest, '');
            const combinedSumberDana = [...new Set(entries.map(e => e.sumber_dana))].join(' / ');
            const ref = entries[0];

            // Menggunakan nama kolom yang sudah Anda definisikan di model (created_at, updated_at)
            return {
                jurnal_id: jurnalId,
                nama: longestNama,
                no_hp: no_hp,
                tanggal: ref.tanggal,
                tahun: ref.tahun,
                zis: ref.zis,
                via: ref.via,
                sumber_dana: combinedSumberDana,
                nominal: totalNominal, 
                jenis_donatur: ref.jenis_donatur,
                cleaned: false,
                notes: '',
                created_at: new Date(),
                updated_at: new Date()
            };
        });

        // 4. Hapus data cleaning LAMA (jika ada) untuk jurnalId ini, untuk mencegah duplikasi saat re-upload
        await JurnalDataCleaning.destroy({ 
            where: { jurnal_id: jurnalId },
            ...options
        });

        // 5. Masukkan data cleaning yang baru diproses
        const result = await JurnalDataCleaning.bulkCreate(cleaningData, options);

        return { 
            status: 'success', 
            message: `Successfully created ${result.length} cleaning records`, 
            count: result.length 
        };
    } catch (error) {
        console.error('Error in moveToCleaning:', error);
        throw error;
    }
}