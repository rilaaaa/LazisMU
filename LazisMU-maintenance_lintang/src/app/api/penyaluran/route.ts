"use server";

import { Jurnal, JurnalDataPenyaluran, Database } from "@/db/db";
import * as exceljs from 'exceljs';
import { Buffer } from 'buffer';

export async function GET(request: Request) {
    try {
        await JurnalDataPenyaluran.sync();
        const allPenyaluranData = await JurnalDataPenyaluran.findAll();
        return new Response(JSON.stringify({ status: 'success', data: allPenyaluranData }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('GET All Penyaluran Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Internal server error' }), {
            status: 500
        });
    }
}

export async function POST(request: Request) {
    const transaction = await Database.transaction();
    try {
        const body = await request.json();
        const { attachment_name, attachment_base64, jenisJurnal } = body;
        if (!attachment_name || !attachment_base64 || !jenisJurnal) {
            return new Response(JSON.stringify({ status: 'error', message: 'Missing required fields' }), { status: 400 });
        }

        const res_jurnal = await Jurnal.create({ name: attachment_name, jenisJurnal }, { transaction });

        if (!res_jurnal || !res_jurnal.id) {
            throw new Error("Kritis: Gagal membuat Jurnal atau ID tidak dikembalikan oleh database. Periksa sequence database!");
        }

        const jurnalId = parseInt(res_jurnal.id, 10); // Pastikan ID adalah integer
        if (isNaN(jurnalId)) {
            throw new Error(`ID Jurnal yang dikembalikan tidak valid: ${res_jurnal.id}`);
        }

        const exceldata = new exceljs.Workbook();
        const buffer = Buffer.from(attachment_base64, 'base64');
        await exceldata.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        const worksheet = exceldata.worksheets[0];
        if (!worksheet) throw new Error("No worksheet found in Excel file.");
        
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
        if (headerRowIndex === -1) throw new Error(`Header tidak ditemukan. Pastikan file Excel Anda memiliki kolom: ${requiredHeaders.join(', ')}`);
        
        const recordsToCreate = [];
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (!row || !row[header_index['nominal']]) continue;
            recordsToCreate.push({
                jurnal_id: jurnalId, // Gunakan ID yang sudah divalidasi
                sumber_dana: row[header_index['sumber dana']]?.toString().trim() || '',
                jenis_penyaluran: row[header_index['jenis penyaluran']]?.toString().trim() || '',
                nominal: parseFloat(row[header_index['nominal']]) || 0
            });
        }

        if (recordsToCreate.length > 0) {
            await JurnalDataPenyaluran.bulkCreate(recordsToCreate, { transaction });
        }

        await transaction.commit();
        return new Response(JSON.stringify({ status: 'success', message: `Berhasil mengimpor ${recordsToCreate.length} data.`, data: { id: jurnalId, count: recordsToCreate.length } }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        await transaction.rollback();
        console.error('POST Penyaluran Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'Failed to process request' }), { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const params_id = new URL(request.url).searchParams.get('id');
        if (!params_id) return new Response(JSON.stringify({ status: 'error', message: 'Invalid parameter: ID is required' }), { status: 400 });
        const deletedCount = await Jurnal.destroy({ where: { id: params_id } });
        if (deletedCount === 0) return new Response(JSON.stringify({ status: 'error', message: 'Data not found' }), { status: 404 });
        return new Response(JSON.stringify({ status: 'success', message: 'Data deleted successfully' }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('DELETE Penyaluran Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Failed to delete data' }), { status: 500 });
    }
}