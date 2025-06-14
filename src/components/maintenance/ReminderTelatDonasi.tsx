'use client';

import React, { useEffect, useState } from 'react';
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

  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/muzzaki?status=telat');
        const json = await res.json();

        const rawData = Array.isArray(json) ? json : json.data;

        const parsed: Muzakki[] = rawData.map((item: any) => ({
          id: item.id,
          nama: item.nama || item.name || 'Tanpa Nama',
          noHp: item.no_hp || item.noHp || '-',
          status: 'Telat Donasi',
          selected: false,
        }));

        setMuzakkiList(parsed);
        setLoading(false);
      } catch (err: any) {
        console.error('Gagal mengambil data:', err);
        setError('Gagal mengambil data muzakki');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSelectAll = (checked: boolean) => {
    setMuzakkiList((list) => list.map((m) => ({ ...m, selected: checked })));
  };

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

    // Contoh: tampilkan hasil kirim
    alert(
      `Mengirim reminder ke:\n${selectedMuzakki
        .map((m) => `${m.nama} (${m.noHp})`)
        .join('\n')}\n\nPesan:\n${pesan}`
    );

    onBack(); // kembali setelah kirim
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
      {loading ? (
        <p>Memuat data muzakki...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-auto max-h-80 border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3 text-center">
                  <Checkbox
                    checked={muzakkiList.length > 0 && muzakkiList.every((m) => m.selected)}
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
      )}

      {/* Tombol Batal dan Kirim */}
      <div className="mt-4 flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
          Batal
        </Button>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleKirim}
        >
          Kirim
        </Button>
      </div>
    </div>
  );
}
