'use server';

import { JurnalDataCleaning, JurnalData } from '@/db/db';
import { JurnalDataRow } from '@/lib/types';
import { Op } from 'sequelize';

export async function GET() {
  try {
    await JurnalDataCleaning.sync();
    await JurnalData.sync();

    // Ambil data muzakki dengan nomor HP
    const muzakkiRaw = await JurnalDataCleaning.findAll({
      where: {
        no_hp: { [Op.ne]: null },
      },
    });

    if (!muzakkiRaw.length) {
      return Response.json({ status: 'success', data: [] });
    }

    // Ambil seluruh nomor HP
    const allPhones = muzakkiRaw.map((row) => {
      const r = row.get() as JurnalDataRow;
      return r.no_hp;
    });

    // Ambil semua riwayat donasi berdasarkan no_hp
    const allDonations = await JurnalData.findAll({
      where: {
        no_hp: { [Op.in]: allPhones },
        nominal: { [Op.gt]: 0 },
      },
      order: [['no_hp', 'ASC'], ['tanggal', 'DESC']],
    });

    // Kelompokkan riwayat donasi berdasarkan nomor HP
    const donationMap = new Map<string, any[]>();
    for (const d of allDonations) {
      const data = d.get();
      const phone = data.no_hp;
      if (!donationMap.has(phone)) {
        donationMap.set(phone, []);
      }
      donationMap.get(phone)!.push({
        tanggal: data.tanggal,
        nominal: data.nominal,
        jenis_donasi: data.jenis_donasi || null,
        via: data.via || null,
      });
    }

    // Satukan data muzakki dan riwayat donasi
    const actual_data = muzakkiRaw.map((entry) => {
      const r = entry.get() as JurnalDataRow;
      const riwayat = r.no_hp ? donationMap.get(r.no_hp) || [] : [];

      return {
        id: r.id,
        name: r.nama,
        phoneNumber: r.no_hp,
        gender: 'Unknown',
        occupation: 'Unknown',
        donationType: r.sumber_dana,
        donorType: r.jenis_donatur,
        category: r.kategori,
        status: 'Aktif',
        year: r.tahun,
        riwayat,
      };
    });

    return Response.json(
      {
        status: 'success',
        data: actual_data,
        count: actual_data.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}