'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [pesan, setPesan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toggleSelect = (id: number) => {
    setSelectedMuzakki((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleKirim = () => {
    if (selectedMuzakki.length === 0 || !pesan.trim()) {
      alert('Pilih minimal 1 muzakki dan isi pesan');
      return;
    }

    console.log('Kirim ke:', selectedMuzakki);
    console.log('Pesan:', pesan);
    alert(`Pesan berhasil dikirim ke ${selectedMuzakki.length} muzakki.`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/muzzaki?kategori=${kategori}`);
        const json = await res.json();

        // Jika format data berasal dari json.data
        const rawData = Array.isArray(json) ? json : json.data;

        if (!Array.isArray(rawData)) {
          throw new Error('Data muzakki tidak dalam format array');
        }

        // Mapping data dari backend ke struktur Muzakki
        const parsed: Muzakki[] = rawData.map((item: any) => ({
          id: item.id,
          name: item.nama || item.name || 'Tanpa Nama',
          phoneNumber: item.no_hp || item.phoneNumber || '-',
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
  }, [kategori]);

  return (
    <div className="p-6">
      <Button onClick={onBack} className="mb-4 bg-gray-300 text-black hover:bg-gray-400">← Kembali</Button>
      <h2 className="text-xl font-bold mb-2">Kirim Pesan ke Kategori: {formatKategori(kategori)}</h2>

      <Textarea
        placeholder="Tulis pesan di sini..."
        value={pesan}
        onChange={(e) => setPesan(e.target.value)}
        className="w-full h-32 mb-4"
      />

      {loading ? (
        <p>Memuat data muzakki...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-auto border rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Pilih</th>
                <th className="p-3">Nama</th>
                <th className="p-3">No. HP</th>
              </tr>
            </thead>
            <tbody>
              {muzakkiList.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedMuzakki.includes(m.id)}
                      onCheckedChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.phoneNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        className="bg-orange-500 text-white hover:bg-orange-600"
        onClick={handleKirim}
      >
        Kirim Pesan ke {selectedMuzakki.length} orang
      </Button>
    </div>
  );
}
