'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search } from 'lucide-react';

interface DonationHistory {
  date: string;
  amount: number;
}

interface Muzakki {
  totalMuzakki: any;
  id: string | number;
  name: string;
  phoneNumber: string;
  lastDonationDate: string;
  status: string;
  selected: boolean;
  donationHistory: DonationHistory[];
  expectedDonationDate: string;
  daysLate: number;
  averageDonationDay: number;
}

interface Props {
  onBack: () => void;
  onLoaded?: (muzakkiTelat: Muzakki[]) => void;
}

export default function ReminderTelatDonasi({ onBack, onLoaded }: Props) {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [pesan, setPesan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuzakki, setSelectedMuzakki] = useState<(string | number)[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const today = new Date();

  const checkConsistent = (history: DonationHistory[]) => {
    if (history.length < 1) return { isValid: false, averageDay: 0 }; // Ubah minimal jadi 1
    const sorted = [...history].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3);
    const days = sorted.map(d => new Date(d.date).getDate());
    const averageDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    return { isValid: true, averageDay };
  };

  const calculateDaysLate = (avgDay: number) => {
    const expected = new Date(today.getFullYear(), today.getMonth(), avgDay);
    return Math.max(0, Math.floor((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/muzzaki');
        const json = await res.json();
        const raw = json?.data || [];

        const final: Muzakki[] = raw.map((d: any) => {
          const history = (d.riwayat || []).map((r: any) => {
            const parsedDate = new Date(r?.tanggal);
            return {
              date: isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString(),
              amount: r?.nominal || 0,
            };
          }).filter((h: { date: any; }) => h.date);

          const { isValid, averageDay } = checkConsistent(history);
          if (!isValid) return null;

          const thisMonth = history.some((h: { date: string | number | Date; }) => {
            const dt = new Date(h.date);
            return dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear();
          });

          if (thisMonth) return null;

          const daysLate = calculateDaysLate(averageDay);
          if (daysLate <= 0) return null;

          return {
            id: d.id || d.phoneNumber,
            name: d.name || 'Tanpa Nama',
            phoneNumber: d.phoneNumber || '',
            lastDonationDate: history[0]?.date,
            status: 'Telat Donasi',
            selected: false,
            donationHistory: history.slice(0, 3),
            expectedDonationDate: new Date(today.getFullYear(), today.getMonth(), averageDay).toISOString().split('T')[0],
            daysLate,
            averageDonationDay: averageDay,
          };
        }).filter(Boolean);

        setMuzakkiList(final);
        if (onLoaded) onLoaded(final);
      } catch (e) {
        setMuzakkiList([]);
        if (onLoaded) onLoaded([]);
      }
    };

    fetchData();
  }, []);

  const filtered = muzakkiList.filter(
    (m) =>
      (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (m.phoneNumber?.includes(searchTerm) ?? false)
  );

  const toggleSelect = (id: string | number) => {
    setSelectedMuzakki((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMuzakki([]);
    } else {
      setSelectedMuzakki(filtered.map((m) => m.id));
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

    const personalizedMessage = pesan
      .replace(/{{nama}}/gi, m.name)
      .replace(/{{tanggal}}/gi, m.averageDonationDay.toString());

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

      if (!res.ok) throw new Error(`Gagal: ${await res.text()}`);

      alert(`Pesan berhasil dikirim ke ${m.name}`);
    } catch (error) {
      console.error(error);
      alert(`Gagal kirim ke ${m.name}`);
    }
  };

  return (
    <div className="p-6">
      <Button onClick={onBack} className="mb-4 bg-gray-100 text-black hover:bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-medium">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">Reminder Donatur Telat</h2>

      <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
        <Textarea
          placeholder="Tulis pesan di sini, gunakan {{nama}}..."
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          className="w-full h-40"
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
              <th className="p-4 border-r border-gray-300 text-center">Hari Terlambat</th>
              <th className="p-4 border-r border-gray-300 text-center">Tanggal Biasa</th>
              <th className="p-4">Kirim Manual</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-t border-gray-300 hover:bg-gray-50">
                  <td className="p-4 text-center border-r border-gray-300">
                    <Checkbox
                      checked={selectedMuzakki.includes(m.id)}
                      onCheckedChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="p-4 border-r border-gray-300">{m.name}</td>
                  <td className="p-4 border-r border-gray-300">{m.phoneNumber}</td>
                  <td className="p-4 border-r border-gray-300 text-center">{m.daysLate} hari</td>
                  <td className="p-4 border-r border-gray-300 text-center">Tanggal {m.averageDonationDay}</td>
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