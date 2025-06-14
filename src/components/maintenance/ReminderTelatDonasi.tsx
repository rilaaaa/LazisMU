'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, ArrowLeft } from 'lucide-react';

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

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([
    { id: 1, nama: 'Fuandi', noHp: '081614875138', status: 'Telat Donasi', selected: false },
    { id: 2, nama: 'Almaira', noHp: '085287564924', status: 'Telat Donasi', selected: false },
    { id: 3, nama: 'Zaiman', noHp: '087254976233', status: 'Telat Donasi', selected: false },
    { id: 4, nama: 'Alzalf', noHp: '081235792676', status: 'Telat Donasi', selected: false },
    { id: 5, nama: 'Salmaunisa', noHp: '082762986485', status: 'Telat Donasi', selected: false },
    { id: 6, nama: 'Izzana', noHp: '081555927352', status: 'Telat Donasi', selected: false },
    { id: 7, nama: 'Al-Fahruni', noHp: '08276395631', status: 'Telat Donasi', selected: false },
  ]);

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

    alert(
      `Mengirim reminder ke:\n${selectedMuzakki
        .map((m) => `${m.nama} (${m.noHp})`)
        .join('\n')}\n\nPesan:\n${pesan}\n\nPoster: ${posterFile?.name || 'Tidak ada'}`
    );

    onBack();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-4xl mx-auto">
      {/* Tombol Kembali */}
      <div className="mb-4">
        <Button
          onClick={onBack}
          className="bg-gray-200 text-black hover:bg-gray-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-base font-normal">Kembali</span>
        </Button>
      </div>

      <h2 className="text-lg font-semibold mb-4">Reminder Telat Donasi</h2>

      <div className="mb-4 grid grid-cols-2 gap-6">
        {/* Upload Poster */}
        <div className="relative w-full">
          <label className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer group hover:border-gray-400 transition w-full h-full">
            {!previewUrl ? (
              <>
                <div className="mb-2">Upload</div>
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            ) : (
              <img src={previewUrl} alt="Preview Poster" className="w-full h-40 object-contain rounded" />
            )}
          </label>

          {previewUrl && (
            <button
              type="button"
              onClick={() => {
                setPosterFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
              title="Hapus gambar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Pesan Reminder */}
        <textarea
          rows={8}
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 resize-none w-full"
        />
      </div>

      {/* Daftar Muzakki */}
      <div className="overflow-auto max-h-80 border rounded-lg">
        <table className="w-full table-fixed text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-10 p-3 border text-center">
                <Checkbox
                  checked={muzakkiList.every((m) => m.selected)}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
              </th>
              <th className="w-1/3 p-3 border text-left whitespace-nowrap">Nama Muzakki</th>
              <th className="w-1/3 p-3 border text-left whitespace-nowrap">Nomor HP</th>
              <th className="w-1/4 p-3 border text-left whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {muzakkiList.map((m, index) => (
              <tr
                key={m.id}
                className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-3 border text-center">
                  <Checkbox
                    checked={m.selected}
                    onCheckedChange={() => toggleSelect(m.id)}
                  />
                </td>
                <td className="p-3 border whitespace-nowrap">{m.nama}</td>
                <td className="p-3 border whitespace-nowrap">{m.noHp}</td>
                <td className="p-3 border">
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
