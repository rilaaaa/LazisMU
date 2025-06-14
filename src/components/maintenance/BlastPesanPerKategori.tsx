'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface Props {
  kategori: string;
  onBack: () => void;
}

interface Muzakki {
  id: number;
  name: string;
  phoneNumber: string;
}

const formatKategori = (text: string) =>
  text.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function BlastPesanPerKategori({ kategori, onBack }: Props) {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [selectedMuzakki, setSelectedMuzakki] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [pesan, setPesan] = useState('');
  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const dummyData: Muzakki[] = [
      { id: 1, name: 'Ahmad Fajar', phoneNumber: '081234567890' },
      { id: 2, name: 'Siti Nurhaliza', phoneNumber: '081222223333' },
    ];
    setMuzakkiList(dummyData);
  }, [kategori]);

  const toggleSelect = (id: number) => {
    setSelectedMuzakki((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMuzakki([]);
    } else {
      const allIds = filteredMuzakki.map((m) => m.id);
      setSelectedMuzakki(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleKirim = () => {
    if (selectedMuzakki.length === 0 || !pesan.trim()) {
      alert('Pilih minimal 1 muzakki dan isi pesan');
      return;
    }

    console.log('Kirim ke:', selectedMuzakki);
    console.log('Pesan:', pesan);
    if (poster) {
      console.log('Poster:', poster.name);
    }
    alert(`Pesan berhasil dikirim ke ${selectedMuzakki.length} muzakki.`);
  };

  const filteredMuzakki = muzakkiList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phoneNumber.includes(searchTerm)
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

      <h2 className="text-xl font-bold mb-4">
        Kirim Pesan ke Kategori: {formatKategori(kategori)}
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4 relative">
          {posterPreview ? (
            <div className="relative">
              <img
                src={posterPreview}
                alt="Poster Preview"
                className="mx-auto max-h-60 object-contain rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setPoster(null);
                  setPosterPreview(null);
                }}
                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                aria-label="Hapus poster"
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
                onChange={handlePosterChange}
              />
            </label>
          )}
        </div>

        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4">
          <Textarea
            placeholder="Tulis pesan di sini..."
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="h-40"
          />
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <div className="relative w-full md:w-1/3">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1111.172 3.236l4.597 4.597a1 1 0 01-1.414 1.414l-4.597-4.597A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Cari"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      <div className="overflow-auto border rounded-lg shadow-lg mb-4 bg-white">
        <table className="w-full text-sm table-fixed border-collapse">
          <thead className="bg-gray-100">
            <tr className="border-b">
              <th className="p-3 w-12 border-r text-left">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 border-r text-left">Nama</th>
              <th className="p-3 border-r text-left">No. HP</th>
              <th className="p-3 text-left">Kirim Manual</th>
            </tr>
          </thead>
          <tbody>
            {filteredMuzakki.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-left py-4 text-gray-400 pl-4">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              filteredMuzakki.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 border-r text-left">
                    <Checkbox
                      checked={selectedMuzakki.includes(m.id)}
                      onCheckedChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="p-3 border-r text-left">{m.name}</td>
                  <td className="p-3 border-r text-left">{m.phoneNumber}</td>
                  <td className="p-3 text-left">
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 text-sm rounded-lg"
                      onClick={() =>
                        alert(`Kirim manual ke ${m.name} (${m.phoneNumber})`)
                      }
                    >
                      Kirim
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button
        className="bg-orange-500 text-white hover:bg-orange-600"
        onClick={handleKirim}
      >
        Kirim Pesan ke {selectedMuzakki.length} orang
      </Button>
    </div>
  );
}
