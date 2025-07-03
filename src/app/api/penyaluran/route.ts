// D:\Semester_6\kepin\new\LazisMU-maintenance_lintang\LazisMU-maintenance_lintang\src\app\api\penyaluran\route.ts

"use server";

import { Jurnal, JurnalDataPenyaluran, Database } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';
import { Deferrable, Transaction } from 'sequelize';
import { NextResponse } from "next/server";

// ========================================================================
// === FUNGSI GET (Untuk mengambil data penyaluran) ===
// ========================================================================
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        let data;
        if (id) {
            // Jika ada ID, cari satu data penyaluran spesifik
            data = await JurnalDataPenyaluran.findOne({ where: { id: id } });
            if (!data) {
                return NextResponse.json({ status: 'error', message: 'Data penyaluran tidak ditemukan' }, { status: 404 });
            }
        } else {
            // Jika tidak ada ID, ambil semua data penyaluran
            data = await JurnalDataPenyaluran.findAll({
                order: [['createdAt', 'DESC']]
            });
        }
        
        return NextResponse.json({ status: 'success', data: data });

    } catch (error) {
        console.error('GET /api/penyaluran Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
    }
}


// ========================================================================
// === FUNGSI POST (Untuk mengunggah file Excel penyaluran) ===
// ========================================================================
export async function POST(request: Request) {
    console.log("\n--- [START] Menerima request POST /api/penyaluran ---");
    const transaction: Transaction = await Database.transaction();
    
    try {
        console.log("[1/8] Memulai parsing body request...");
        const body = await request.json();
        const { attachment_name, attachment_base64 } = body; 
        if (!attachment_name || !attachment_base64) {
            throw new Error('Missing required fields');
        }
        console.log("[2/8] Body request valid. Mencoba membuat Jurnal Induk...");

        const res_jurnal = await Jurnal.create({ 
            name: attachment_name, 
            jenisJurnal: 'penyaluran' // Tandai sebagai jurnal penyaluran
        }, { transaction });

        if (!res_jurnal || !res_jurnal.id) {
            throw new Error("Kritis: Gagal membuat Jurnal.");
        }
        const jurnalId = res_jurnal.id;
        console.log(`[3/8] Jurnal Induk dibuat di transaksi. ID = ${jurnalId}`);

        console.log("[4/8] Memproses file Excel...");
        const exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        await exceldata.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        const worksheet = exceldata.worksheets[0];
        if (!worksheet) throw new Error("No worksheet found in Excel file.");
        console.log("[5/8] File Excel berhasil di-load. Memvalidasi header...");

        const data = worksheet.getSheetValues();
        let headerRowIndex = -1;
        let header_index: { [key: string]: number } = {};
        const requiredHeaders = ['sumber dana', 'jenis penyaluran', 'nominal'];
        
        for (let i = 1; i <= 10 && i < data.length; i++) {
            const row = data[i] as string[];
            if (!row) continue;
            const foundHeaders = row.map(h => typeof h === 'string' ? h.toLowerCase().trim() : '');
            const allRequiredFound = requiredHeaders.every(req => foundHeaders.includes(req));
            if (allRequiredFound) {
                headerRowIndex = i;
                row.forEach((val, idx) => { if (val) header_index[val.toLowerCase().trim()] = idx; });
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error(`Header tidak ditemukan. Pastikan file Excel memiliki kolom: ${requiredHeaders.join(', ')}`);
        }
        console.log(`[6/8] Header valid. Memproses ${data.length - headerRowIndex -1} baris data...`);
        
        const recordsToCreate = [];
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (!row || row.filter(cell => cell).length === 0) continue;
            const sumberDana = (row[header_index['sumber dana']] || '').toString().trim();
            const jenisPenyaluran = (row[header_index['jenis penyaluran']] || '').toString().trim();
            const nominal = parseFloat(row[header_index['nominal']]);
            if (!sumberDana || !jenisPenyaluran || isNaN(nominal) || nominal <= 0) continue;
            recordsToCreate.push({
                jurnal_id: jurnalId,
                sumber_dana: sumberDana,
                jenis_penyaluran: jenisPenyaluran,
                nominal: nominal
            });
        }

        if (recordsToCreate.length === 0) {
             throw new Error("Tidak ada data baris yang valid ditemukan di file Excel.");
        }
        console.log(`[7/8] Ditemukan ${recordsToCreate.length} record valid. Menjalankan bulkCreate...`);

        await JurnalDataPenyaluran.bulkCreate(recordsToCreate, { transaction });
        console.log("[8/8] bulkCreate berhasil. Melakukan commit...");

        await transaction.commit();
        console.log("--- [SUCCESS] Transaksi berhasil di-commit. ---");
        
        return NextResponse.json({
            status: 'success',
            message: `Berhasil mengimpor ${recordsToCreate.length} data penyaluran.`,
            data: { id: jurnalId, count: recordsToCreate.length }
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error('--- [ERROR] PROSES UNGGAH PENYALURAN GAGAL. Transaksi di-rollback. ---');
        console.error('Penyebab Kegagalan:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal memproses permintaan';
        
        return NextResponse.json({
            status: 'error',
            message: errorMessage
        }, { status: 500 });
    }
}