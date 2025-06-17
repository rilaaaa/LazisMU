'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Upload, X, ArrowLeft, Search } from 'lucide-react';

interface Muzakki {
  id: number;
  name: string;
  phoneNumber: string;
  status: string;
  selected: boolean;
}

interface Props {
  onBack: () => void;
}

export default function ReminderTelatDonasi({ onBack }: Props) {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [pesan, setPesan] = useState(
    `Assalamualaikum Warohmatullahi Wabarokatuh, Bapak/Ibu yang terhormat.

Tidak terasa kita sudah hampir di setengah Ramadhan tahun ini, mari kita intropeksi diri untuk tetap menjaga keimanan dan ketaqwaan kita pada Allah SWT.`
  );
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetch('/api/muzzaki-transactions')
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data) ? data : data.data;
        const mapped = parsed.map((item: any) => ({
          id: item.id,
          name: item.nama || item.name || '-',
          phoneNumber: item.no_hp || item.phoneNumber || '-',
          status: item.status || 'Telat Donasi',
          selected: false,
        }));
        setMuzakkiList(mapped);
      });
  }, []);

  const toggleSelect = (id: number) => {
    setMuzakkiList((list) =>
      list.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setSelectAll(checked);
      setMuzakkiList((list) => list.map((m) => ({ ...m, selected: checked })));
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleKirim = () => {
    const selected = muzakkiList.filter((m) => m.selected);
    if (selected.length === 0) {
      alert('Pilih minimal satu muzakki yang ingin dikirimi reminder.');
      return;
    }

    selected.forEach((m) => {
      const personalizedMessage = `Assalamualaikum ${m.name},\n\n${pesan}`;
      window.open(
        `https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`,
        '_blank'
      );
    });

    onBack();
  };

  const filteredMuzakki = muzakkiList.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <Button
        onClick={onBack}
        className="mb-4 bg-gray-100 text-black hover:bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-medium">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">Reminder Telat Donasi</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Poster Upload */}
        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4 relative">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Poster Preview"
                className="mx-auto max-h-60 object-contain rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setPosterFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center h-48 text-gray-500 hover:text-gray-700 border-dashed border-2 border-gray-300 rounded-lg">
              <Upload className="w-8 h-8 mb-2" />
              <span>Upload Poster</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterUpload}
              />
            </label>
          )}
        </div>

        {/* Pesan */}
        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4">
          <textarea
            rows={8}
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="w-full h-40 resize-none border-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Pencarian */}
      <div className="flex justify-end mb-4 relative w-full md:w-1/3 ml-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Tabel */}
      <div className="overflow-auto rounded-lg shadow mb-6 bg-white">
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-gray-100 text-left font-semibold border-b border-gray-300">
            <tr>
              <th className="p-4 w-12 text-center border-r border-gray-300">
                <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
              </th>
              <th className="p-4 border-r border-gray-300">Nama</th>
              <th className="p-4 border-r border-gray-300">No. HP</th>
              <th className="p-4">Kirim Manual</th>
            </tr>
          </thead>
          <tbody>
            {filteredMuzakki.length === 0 ? (
              <tr className="border-t border-gray-300">
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              filteredMuzakki.map((m) => {
                const personalized = pesan.replace(/{{nama}}/gi, m.name);
                return (
                  <tr key={m.id} className="border-t border-gray-300 hover:bg-gray-50">
                    <td className="p-4 text-center border-r border-gray-300">
                      <Checkbox
                        checked={m.selected}
                        onCheckedChange={() => toggleSelect(m.id)}
                      />
                    </td>
                    <td className="p-4 border-r border-gray-300">{m.name}</td>
                    <td className="p-4 border-r border-gray-300">{m.phoneNumber}</td>
                    <td className="p-4">
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(
                              personalized
                            )}`
                          )
                        }
                      >
                        Kirim
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol Kirim */}
      <Button
        className="bg-orange-500 text-white hover:bg-orange-600 w-full md:w-auto px-6 py-2 rounded-lg"
        onClick={handleKirim}
      >
        Kirim Pesan ke {muzakkiList.filter((m) => m.selected).length} Orang
      </Button>
    </div>
  );
}
