'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Muzakki {
  id: number;
  nama: string;
  noHp: string;
  status: string;
  selected: boolean;
}

interface Props {
  onBack: () => void;
}

export default function ReminderTelatDonasi({ onBack }: Props) {
  const [pesan, setPesan] = useState(
    `Assalamualaikum Warohmatullahi Wabarokatuh, Bapak/Ibu yang terhormat.\n\nTidak terasa kita sudah hampir di setengah Ramadhan tahun ini, mari kita intropeksi diri untuk tetap menjaga keimanan dan ketaqwaan kita pada Allah SWT.`
  );

  // Dummy data muzakki telat donasi
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([
    { id: 1, nama: 'Fuandi', noHp: '081614875138', status: 'Telat Donasi', selected: false },
    { id: 2, nama: 'Almaira', noHp: '085287564924', status: 'Telat Donasi', selected: false },
    { id: 3, nama: 'Zaiman', noHp: '087254976233', status: 'Telat Donasi', selected: false },
    { id: 4, nama: 'Alzalf', noHp: '081235792676', status: 'Telat Donasi', selected: false },
    { id: 5, nama: 'Salmaunisa', noHp: '082762986485', status: 'Telat Donasi', selected: false },
    { id: 6, nama: 'Izzana', noHp: '081555927352', status: 'Telat Donasi', selected: false },
    { id: 7, nama: 'Al-Fahruni', noHp: '08276395631', status: 'Telat Donasi', selected: false },
  ]);

  // Pilih semua checkbox
  const toggleSelectAll = (checked: boolean) => {
    setMuzakkiList((list) => list.map((m) => ({ ...m, selected: checked })));
  };

  // Pilih per muzakki
  const toggleSelect = (id: number) => {
    setMuzakkiList((list) =>
      list.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleKirim = () => {
    const selectedMuzakki = muzakkiList.filter((m) => m.selected);
    if (selectedMuzakki.length === 0) {
      alert('Pilih minimal satu muzakki yang ingin dikirimi reminder.');
      return;
    }

    // Contoh: tampilkan hasil kirim (bisa diganti dengan API call)
    alert(
      `Mengirim reminder ke:\n${selectedMuzakki
        .map((m) => `${m.nama} (${m.noHp})`)
        .join('\n')}\n\nPesan:\n${pesan}`
    );

    // Setelah kirim, bisa kembali ke halaman sebelumnya
    onBack();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Reminder Telat Donasi</h2>

      <div className="mb-4 grid grid-cols-2 gap-6">
        {/* Upload Poster Placeholder */}
        <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
          <div className="mb-2">Upload Poster</div>
          <div className="text-3xl">⬆️</div>
        </div>

        {/* Pesan Reminder */}
        <textarea
          rows={8}
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          className="border rounded-lg p-3 resize-none w-full"
        />
      </div>

      {/* Daftar Muzakki */}
      <div className="overflow-auto max-h-80 border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-center">
                <Checkbox
                  checked={muzakkiList.every((m) => m.selected)}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
              </th>
              <th className="p-3">Nama Muzakki</th>
              <th className="p-3">Nomor HP</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {muzakkiList.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 text-center">
                  <Checkbox
                    checked={m.selected}
                    onCheckedChange={() => toggleSelect(m.id)}
                  />
                </td>
                <td className="p-3">{m.nama}</td>
                <td className="p-3">{m.noHp}</td>
                <td className="p-3">
                  <span className="inline-block bg-orange-500 text-white rounded-full px-3 py-1 text-xs">
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tombol Batal dan Kirim */}
      <div className="mt-4 flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
          Batal
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleKirim}>
          Kirim
        </Button>
      </div>
    </div>
  );
}
