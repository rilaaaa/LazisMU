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

  useEffect(() => {
    const dummyData: Muzakki[] = [
      { id: 1, name: 'Ahmad Fajar', phoneNumber: '081234567890' },
      { id: 2, name: 'Siti Aisyah', phoneNumber: '089876543210' },
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
      const allIds = muzakkiList.map((m) => m.id);
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

  return (
    <div className="p-6">
      {/* Tombol Kembali */}
      <Button
        onClick={onBack}
        className="mb-4 bg-gray-200 text-black hover:bg-gray-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-normal">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">
        Kirim Pesan ke Kategori: {formatKategori(kategori)}
      </h2>

      {/* Poster dan Pesan Side by Side */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Poster upload */}
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

        {/* Textarea pesan */}
        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4">
          <Textarea
            placeholder="Tulis pesan di sini..."
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="h-40"
          />
        </div>
      </div>

      {/* Tabel penerima */}
      <div className="overflow-auto border rounded-lg shadow-lg mb-4 bg-white">
        <table className="w-full text-sm table-fixed border-collapse">
          <thead className="bg-gray-100 text-center">
            <tr className="border-b">
              <th className="p-3 w-12 border-r">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 border-r">Nama</th>
              <th className="p-3">No. HP</th>
            </tr>
          </thead>
          <tbody>
            {muzakkiList.map((m) => (
              <tr key={m.id} className="border-b text-center hover:bg-gray-50">
                <td className="p-3 border-r">
                  <Checkbox
                    checked={selectedMuzakki.includes(m.id)}
                    onCheckedChange={() => toggleSelect(m.id)}
                  />
                </td>
                <td className="p-3 border-r">{m.name}</td>
                <td className="p-3">{m.phoneNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tombol kirim */}
      <Button
        className="bg-orange-500 text-white hover:bg-orange-600"
        onClick={handleKirim}
      >
        Kirim Pesan ke {selectedMuzakki.length} orang
      </Button>
    </div>
  );
}
