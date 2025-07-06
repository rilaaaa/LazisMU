'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search } from 'lucide-react';

interface Props {
  onBack: () => void;
  muzakkiList: Muzakki[];
}

interface Muzakki {
  id: number;
  name: string;
  phoneNumber: string;
  donorType: string;
  kategori?: string;
}

export default function BlastPesanPerKategori({ onBack, muzakkiList }: Props) {
  const kategoriList = ['Calon', 'Momentum', 'Besar Sering', 'Besar Jarang', 'Kecil Sering', 'Kecil Jarang'];
  const [selectedTab, setSelectedTab] = useState('Calon');
  const [selectedMuzakki, setSelectedMuzakki] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [pesan, setPesan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMuzakki = muzakkiList.filter(
    (m) =>
      m.donorType === selectedTab &&
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phoneNumber.includes(searchTerm))
  );

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

  const handleKirim = async () => {
    if (selectedMuzakki.length === 0 || !pesan.trim()) {
      alert('Pilih minimal 1 muzakki dan isi pesan');
      return;
    }

    const selectedData = muzakkiList.filter((m) => selectedMuzakki.includes(m.id));

    const recipients = selectedData.map((m) => ({
      name: m.name,
      no: m.phoneNumber.startsWith('62') ? m.phoneNumber : `62${m.phoneNumber.replace(/^0+/, '')}`,
    }));

    const payload = {
      recipients,
      template: pesan,
    };

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Gagal kirim:', error);
        alert('Pengiriman gagal. Cek console.');
        return;
      }

      const result = await res.json();
      console.log('Response API:', result);
      alert(`Pesan berhasil dikirim ke ${selectedMuzakki.length} muzakki.`);
    } catch (error) {
      console.error('Kesalahan saat mengirim:', error);
      alert('Terjadi kesalahan saat mengirim pesan.');
    }
  };

  const handleKirimManual = async (m: Muzakki) => {
    if (!pesan.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    const formattedNumber = m.phoneNumber.startsWith('62')
      ? m.phoneNumber
      : `62${m.phoneNumber.replace(/^0+/, '')}`;

    const personalizedMessage = pesan.replace(/{{nama}}/gi, m.name);

    const payload = {
      recipients: [{ name: m.name, no: formattedNumber }],
      template: personalizedMessage,
    };

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Gagal kirim:', error);
        alert(`Gagal mengirim ke ${m.name}.`);
        return;
      }

      const result = await res.json();
      console.log(`Berhasil kirim ke ${m.name}`, result);
      alert(`Pesan berhasil dikirim ke ${m.name}.`);
    } catch (error) {
      console.error('Kesalahan saat mengirim:', error);
      alert(`Terjadi kesalahan saat kirim ke ${m.name}`);
    }
  };

  return (
    <div className="p-6">
      <Button onClick={onBack} className="mb-4 bg-gray-100 text-black hover:bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-medium">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">
        Kirim Pesan ke Kategori: {selectedTab}
      </h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {kategoriList.map((k) => (
          <button
            key={k}
            onClick={() => {
              setSelectedTab(k);
              setSelectedMuzakki([]);
              setSelectAll(false);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition 
              ${selectedTab === k
                ? 'bg-orange-500 text-white border-orange-600'
                : 'bg-white text-black border-gray-300 hover:bg-gray-100'
              }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
        <Textarea
          placeholder="Tulis pesan di sini, gunakan {{nama}} untuk personalisasi..."
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          className="h-40"
        />
      </div>

      <div className="flex justify-end mb-4 relative w-full md:w-1/3 ml-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

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
              filteredMuzakki.map((m) => (
                <tr key={m.id} className="border-t border-gray-300 hover:bg-gray-50">
                  <td className="p-4 text-center border-r border-gray-300">
                    <Checkbox
                      checked={selectedMuzakki.includes(m.id)}
                      onCheckedChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="p-4 border-r border-gray-300">{m.name}</td>
                  <td className="p-4 border-r border-gray-300">{m.phoneNumber}</td>
                  <td className="p-4">
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded"
                      onClick={() => handleKirimManual(m)}
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
        className="bg-orange-500 text-white hover:bg-orange-600 w-full md:w-auto px-6 py-2 rounded-lg"
        onClick={handleKirim}
      >
        Kirim Pesan ke {selectedMuzakki.length} Orang
      </Button>
    </div>
  );
}