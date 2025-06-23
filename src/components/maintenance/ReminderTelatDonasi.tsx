'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, ArrowLeft, Search } from 'lucide-react';

interface Muzakki {
  id: number;
  name: string;
  phoneNumber: string;
  lastDonationDate: string;
  status: string;
  selected: boolean;
  donationHistory: {
    month: string;
    year: number;
    amount: number;
  }[];
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

  useEffect(() => {
    const fetchMuzakkiData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/muzzaki');
        const result = await response.json();

        // Ambil array data-nya (misal dari { data: [...] })
        const data = Array.isArray(result) ? result : result.data;

        if (!Array.isArray(data)) {
          throw new Error('Format data dari API tidak sesuai, harus berupa array.');
        }

        const regularDonors = data.filter((donatur: any) => {
          const lastTransactions = donatur.transactions
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4);

          if (lastTransactions.length < 3) return false;

          const firstDate = new Date(lastTransactions[0].date);
          const secondDate = new Date(lastTransactions[1].date);
          const thirdDate = new Date(lastTransactions[2].date);

          const dayDiff1 = Math.abs(firstDate.getDate() - secondDate.getDate());
          const dayDiff2 = Math.abs(secondDate.getDate() - thirdDate.getDate());

          const isConsecutiveMonths =
            (firstDate.getMonth() - secondDate.getMonth() === 1 ||
              (firstDate.getMonth() === 0 && secondDate.getMonth() === 11)) &&
            (secondDate.getMonth() - thirdDate.getMonth() === 1 ||
              (secondDate.getMonth() === 0 && thirdDate.getMonth() === 11));

          const currentMonth = new Date().getMonth();
          const hasCurrentMonthDonation = lastTransactions.some(
            (t: any) => new Date(t.date).getMonth() === currentMonth
          );

          return dayDiff1 <= 2 && dayDiff2 <= 2 && isConsecutiveMonths && !hasCurrentMonthDonation;
        });

        const mappedData = regularDonors.map((donatur: any) => ({
          id: donatur.id,
          name: donatur.nama,
          phoneNumber: donatur.no_hp,
          lastDonationDate: donatur.transactions[0].date,
          status: 'Telat Donasi',
          selected: false,
          donationHistory: donatur.transactions.slice(0, 3).map((t: any) => ({
            month: new Date(t.date).toLocaleString('id-ID', { month: 'long' }),
            year: new Date(t.date).getFullYear(),
            amount: t.amount,
          })),
        }));

        setMuzakkiList(mappedData);
        setFilteredMuzakki(mappedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMuzakkiData();
  }, []);

  useEffect(() => {
    const filtered = muzakkiList.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phoneNumber.includes(search)
    );
    setFilteredMuzakki(filtered);
  }, [search, muzakkiList]);

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
      const personalizedMessage = pesan.replace(/{{nama}}/gi, m.name);
      window.open(
        `https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`,
        '_blank'
      );
    });

    alert(`Pesan telah dikirim ke ${selected.length} donatur`);
    onBack();
  };

  return (
    <div className="p-6">
      <Button
        onClick={onBack}
        className="mb-4 bg-gray-100 text-black hover:bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-medium">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold mb-4">Reminder Donatur Rutin</h2>
      <p className="text-gray-600 mb-6">
        Daftar donatur yang biasanya rutin berdonasi 3 bulan berturut-turut di tanggal yang sama,
        tetapi bulan ini belum melakukan donasi.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Poster Upload dan Pesan */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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

            <div className="flex-1 border-2 border-gray-300 rounded-lg p-4">
              <textarea
                rows={8}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full h-40 resize-none border-0 focus:outline-none"
                placeholder="Tulis pesan reminder disini..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Gunakan <code>{'{{nama}}'}</code> untuk menampilkan nama donatur
              </p>
            </div>
          </div>

          {/* Pencarian */}
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

          {/* Tabel Donatur */}
          <div className="overflow-auto rounded-lg shadow mb-6 bg-white">
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100 text-left font-semibold border-b border-gray-300">
                <tr>
                  <th className="p-4 w-12 text-center border-r border-gray-300">
                    <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="p-4 border-r border-gray-300">Nama</th>
                  <th className="p-4 border-r border-gray-300">No. HP</th>
                  <th className="p-4 border-r border-gray-300">Riwayat Donasi</th>
                  <th className="p-4">Kirim Manual</th>
                </tr>
              </thead>
              <tbody>
                {filteredMuzakki.length === 0 ? (
                  <tr className="border-t border-gray-300">
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      {muzakkiList.length === 0
                        ? 'Tidak ada donatur yang teridentifikasi telat donasi'
                        : 'Tidak ditemukan hasil pencarian'}
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
                        <td className="p-4 border-r border-gray-300">
                          <div className="flex flex-col">
                            {m.donationHistory.map((d, i) => (
                              <span key={i}>
                                {d.month} {d.year}: Rp{d.amount.toLocaleString('id-ID')}
                              </span>
                            ))}
                          </div>
                        </td>
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

          {/* Tombol Kirim Semua */}
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
