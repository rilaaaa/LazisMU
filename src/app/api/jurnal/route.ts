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
    const { attachment_name, attachment_base64, jenisJurnal } = body;
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
    
        // Define expected headers based on your Excel file structure
        const expected_headers = ['no', 'tangal', 'nama', 'telp/hp', 'donasi', 'via', 'keterangan'];
        const header_mapping: { [key: string]: string } = {
            'tangal': 'tanggal', // Fix typo in header
            'keterangan': 'sumber_dana' // Map keterangan to sumber_dana
        };
    
        // Start reading headers from row 5 (index 4 in zero-based)
        const header = data[5] as string[]; // Changed to row 5 (index 4)
        if (!header || header.length === 0) {
            throw new Error('Header row not found or empty');
        }
    
        const header_index: { [key: string]: number } = {};
        const donation_columns: number[] = []; // To store indices of all donation columns
    
        // Normalize and map header positions
        for (let i = 0; i < header.length; i++) {
            let header_name = header[i];
            if (header_name == undefined) {
                continue;
            }
    
            header_name = header_name.toLowerCase().trim();
            
            // Check if this is a donation column (donasi, donasi a, donasi b, etc.)
            if (header_name.includes('donasi')) {
                donation_columns.push(i);
                header_index['donasi'] = i; // Will keep the last one if multiple
            } else {
                header_index[header_name] = i;
            }
        }
    
        // Check for missing headers and set to -1 in header_index if missing
        for (const expected_header of expected_headers) {
            if (!(expected_header in header_index)) {
                header_index[expected_header] = -1; // Set to -1 if header is missing
            }
        }
    
        const row_data: KeyValue[] = [];
        // Start reading data from row 6 (index 5 in zero-based)
        for (let i = 7; i < data.length; i++) {
            const data_iter = data[i] as string[];
            if (!data_iter || data_iter.length === 0) continue; // Skip empty rows
            
            // Calculate total donation from all donation columns
            let totalDonation = 0;
            if (donation_columns.length > 0) {
                for (const col of donation_columns) {
                    const donationValue = parseInt(data_iter[col]) || 0;
                    totalDonation += donationValue;
                }
            } else if (header_index['donasi'] !== -1) {
                totalDonation = parseInt(data_iter[header_index['donasi']]) || 0;
            }
            
            const row: KeyValue = {
                ['nama']: header_index['nama'] !== -1 ? data_iter[header_index['nama']]?.trim() || '' : '',
                ['no_hp']: header_index['telp/hp'] !== -1 ? data_iter[header_index['telp/hp']]?.trim() || '' : '',
                ['tanggal']: header_index['tangal'] !== -1 ? data_iter[header_index['tangal']] || '' : '',
                ['tahun']: header_index['tangal'] !== -1 ? extractYearFromDate(data_iter[header_index['tangal']]) : 0,
                ['zis']: '', // Your Excel doesn't have zis column
                ['via']: header_index['via'] !== -1 ? data_iter[header_index['via']]?.trim() || '' : '',
                ['sumber_dana']: header_index['keterangan'] !== -1 ? data_iter[header_index['keterangan']]?.trim() || '' : '',
                ['nominal']: totalDonation
            };
    
            row_data.push(row);
        }
    
        const classifier = new DonationClassifier();
        const classified_data = classifier.classify(row_data);
    
        const res_jurnal = await Jurnal.create({
            'name': attachment_name,
            'jenisJurnal': jenisJurnal
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
            message: 'Failed to upload data: ' + (error instanceof Error ? error.message : String(error))
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

function extractYearFromDate(dateString: string): number {
    if (!dateString) return 0;
    
    try {
        // Try parsing as Date object first
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.getFullYear();
        }
        
        // Try extracting year from string patterns (like "DD/MM/YYYY")
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch && yearMatch[1]) {
            return parseInt(yearMatch[1]);
        }
        
        // Try splitting by common separators
        const parts = dateString.split(/[/\-.]/);
        if (parts.length >= 3) {
            // Check which part looks like a year (4 digits)
            for (const part of parts) {
                if (/^\d{4}$/.test(part)) {
                    return parseInt(part);
                }
            }
            // If no 4-digit part found, assume last part is year (for 2-digit years)
            const lastPart = parts[parts.length - 1];
            return parseInt(lastPart) > 50 ? 1900 + parseInt(lastPart) : 2000 + parseInt(lastPart);
        }
        
        return 0;
    } catch (e) {
        console.error('Error parsing date:', dateString, e);
        return 0;
    }
}