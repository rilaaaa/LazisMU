'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, ArrowLeft, Search } from 'lucide-react';

interface DonationHistory {
  date: string;
  amount: number;
}

interface Muzakki {
  id: number | string;
  name: string;
  phoneNumber: string;
  lastDonationDate: string;
  status: string;
  selected: boolean;
  donationHistory: DonationHistory[];
  expectedDonationDate: string;
  daysLate: number;
}

interface Props {
  onBack: () => void;
}

export default function ReminderTelatDonasi({ onBack }: Props) {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [filteredMuzakki, setFilteredMuzakki] = useState<Muzakki[]>([]);
  const [pesan, setPesan] = useState(
    `Assalamualaikum Warohmatullahi Wabarokatuh, Bapak/Ibu {{nama}} yang terhormat.\n\nKami dari Lazismu ingin mengingatkan bahwa biasanya Bapak/Ibu rutin berdonasi setiap bulan. Namun untuk bulan ini kami belum menerima donasi dari Bapak/Ibu.\n\nSemoga Allah SWT senantiasa melimpahkan rezeki dan keberkahan untuk Bapak/Ibu dan keluarga.`
  );
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());

  const calculateExpectedDonationDate = (donationHistory: DonationHistory[]) => {
    if (donationHistory.length < 3) return null;
    const lastThree = donationHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    const donationDays = lastThree.map(d => new Date(d.date).getDate());
    const avgDay = Math.round(donationDays.reduce((sum, day) => sum + day, 0) / donationDays.length);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(avgDay);
    return expectedDate.toISOString().split('T')[0];
  };

  const calculateDaysLate = (lastDonationDate: string, expectedDate: string) => {
    const expected = new Date(expectedDate);
    const diffTime = currentDate.getTime() - expected.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const fetchReminderData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/muzzaki');
        if (!response.ok) throw new Error('Gagal fetch data');

        const json = await response.json();
        const donors = Array.isArray(json?.data) ? json.data : [];

        const mapped: Muzakki[] = donors.map((d: any) => {
          const donationHistory = d.riwayat?.map((r: any) => ({
            date: r.tanggal,
            amount: r.nominal || 0
          })) || [];

          const expectedDonationDate = calculateExpectedDonationDate(donationHistory);
          const lastDonationDate = d.last_donation_date || d.tanggal || '';

          return {
            id: d.id || d.no_hp,
            name: d.nama,
            phoneNumber: d.no_hp,
            lastDonationDate,
            status: expectedDonationDate ? 'Telat Donasi' : 'Tidak Rutin',
            selected: false,
            donationHistory,
            expectedDonationDate: expectedDonationDate || '',
            daysLate: expectedDonationDate
              ? calculateDaysLate(lastDonationDate, expectedDonationDate)
              : 0
          };
        });

        const lateDonors = mapped.filter(m => m.status === 'Telat Donasi' && m.daysLate > 0);
        setMuzakkiList(lateDonors);
        setFilteredMuzakki(lateDonors);
      } catch (err) {
        console.error('Gagal ambil data:', err);
        setMuzakkiList([]);
        setFilteredMuzakki([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminderData();
  }, []);

  useEffect(() => {
    const filtered = muzakkiList.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phoneNumber.includes(search)
    );
    setFilteredMuzakki(filtered);
  }, [search, muzakkiList]);

  const handlePosterUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const toggleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked);
    setMuzakkiList(prev => prev.map(m => ({ ...m, selected: checked })));
    setFilteredMuzakki(prev => prev.map(m => ({ ...m, selected: checked })));
  }, []);

  const toggleSelect = useCallback((id: number | string) => {
    setMuzakkiList(prev =>
      prev.map(m => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
    setFilteredMuzakki(prev =>
      prev.map(m => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  }, []);

  const handleKirim = useCallback(() => {
    const selectedMuzakki = muzakkiList.filter(m => m.selected);
    if (selectedMuzakki.length === 0) return;
    selectedMuzakki.forEach(m => {
      const personalized = pesan
        .replace(/{{nama}}/gi, m.name)
        .replace(/{{tanggal}}/gi, m.expectedDonationDate);
      window.open(`https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(personalized)}`);
    });
  }, [muzakkiList, pesan]);

  return (
    <div className="p-4 md:p-6">
      <Button
        onClick={onBack}
        className="mb-4 bg-gray-100 text-black hover:bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-medium">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">Reminder Donatur Rutin</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 border-2 border-gray-300 rounded-lg p-4 relative">
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Poster Preview" className="mx-auto max-h-60 object-contain rounded" />
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
                  <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                </label>
              )}
            </div>

            <div className="flex-1 border-2 border-gray-300 rounded-lg p-4">
              <textarea
                rows={8}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full h-40 resize-none border-0 focus:outline-none"
                placeholder="Tulis pesan reminder di sini..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Gunakan <code className="bg-gray-100 px-1 rounded">{`{{nama}}`}</code> untuk menampilkan nama donatur
              </p>

            </div>
          </div>

          <div className="flex justify-end mb-4 relative w-full md:w-1/3 ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="overflow-auto rounded-lg shadow mb-6 bg-white">
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100 text-left font-semibold border-b border-gray-300">
                <tr>
                  <th className="p-4 w-12 text-center border-r border-gray-300">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(checked: any) => toggleSelectAll(checked === true)}
                    />
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
                      {muzakkiList.length === 0
                        ? 'Tidak ada donatur yang teridentifikasi telat donasi'
                        : 'Tidak ditemukan hasil pencarian'}
                    </td>
                  </tr>
                ) : (
                  filteredMuzakki.map((m) => {
                    const personalized = pesan
                      .replace(/{{nama}}/gi, m.name)
                      .replace(/{{tanggal}}/gi, m.expectedDonationDate);
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
                              window.open(`https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(personalized)}`)
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

          <Button
            className="bg-orange-500 text-white hover:bg-orange-600 w-full md:w-auto px-6 py-2 rounded-lg"
            onClick={handleKirim}
            disabled={muzakkiList.filter((m) => m.selected).length === 0}
          >
            Kirim Pesan ke {muzakkiList.filter((m) => m.selected).length} Orang
          </Button>
        </>
      )}
    </div>
  );
}
