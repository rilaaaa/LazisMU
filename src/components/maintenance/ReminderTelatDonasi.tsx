'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search } from 'lucide-react';

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
  averageDonationDay: number;
}

interface Props {
  onBack: () => void;
}

export default function ReminderTelatDonasi({ onBack }: Props) {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [filteredMuzakki, setFilteredMuzakki] = useState<Muzakki[]>([]);
  const [pesan, setPesan] = useState(
    `Assalamualaikum Warohmatullahi Wabarokatuh, Bapak/Ibu {{nama}} yang terhormat.

Kami dari Lazismu ingin mengingatkan bahwa biasanya Bapak/Ibu rutin berdonasi setiap tanggal {{tanggal}}. Namun untuk bulan ini kami belum menerima donasi dari Bapak/Ibu.

Semoga Allah SWT senantiasa melimpahkan rezeki dan keberkahan untuk Bapak/Ibu dan keluarga.

Jazakallahu khairan.`
  );
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());

  const isConsistentThreeMonthDonor = (donationHistory: DonationHistory[]) => {
    if (donationHistory.length < 3) return { isConsistent: false, averageDay: 0 };

    const sortedHistory = [...donationHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastThree = sortedHistory.slice(0, 3);
    const donationDates = lastThree.map(d => new Date(d.date));

    let isConsecutiveMonths = true;
    for (let i = 0; i < donationDates.length - 1; i++) {
      const current = donationDates[i];
      const next = donationDates[i + 1];
      const monthDiff = current.getMonth() - next.getMonth();
      const yearDiff = current.getFullYear() - next.getFullYear();
      const isConsecutive =
        (monthDiff === 1 && yearDiff === 0) || (monthDiff === -11 && yearDiff === 1);
      if (!isConsecutive) {
        isConsecutiveMonths = false;
        break;
      }
    }

    if (!isConsecutiveMonths) return { isConsistent: false, averageDay: 0 };

    const donationDays = donationDates.map(d => d.getDate());
    const averageDay = Math.round(donationDays.reduce((sum, day) => sum + day, 0) / donationDays.length);
    const isDateConsistent = donationDays.every(day => Math.abs(day - averageDay) <= 3);

    return {
      isConsistent: isDateConsistent,
      averageDay: isDateConsistent ? averageDay : 0
    };
  };

  const hasDonatedThisMonth = (donationHistory: DonationHistory[]) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return donationHistory.some(donation => {
      const donationDate = new Date(donation.date);
      return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
    });
  };

  const calculateDaysLate = (averageDay: number) => {
    const expectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), averageDay);
    const diffTime = currentDate.getTime() - expectedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    const fetchReminderData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/muzzaki');
        if (!response.ok) throw new Error('Gagal fetch data');

        const json = await response.json();
        const donors = Array.isArray(json?.data) ? json.data : [];

        const lateDonors: Muzakki[] = [];

        donors.forEach((donor: any) => {
          const donationHistory: DonationHistory[] = (donor.riwayat || []).map((r: any) => ({
            date: r.tanggal || r.date,
            amount: r.nominal || r.amount || 0
          }));

          const { isConsistent, averageDay } = isConsistentThreeMonthDonor(donationHistory);
          if (!isConsistent) return;

          const hasCurrentMonthDonation = hasDonatedThisMonth(donationHistory);
          if (hasCurrentMonthDonation) return;

          const daysLate = calculateDaysLate(averageDay);
          if (daysLate <= 0) return;

          const lastDonationDate = donationHistory.length > 0
            ? donationHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : '';

          const expectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), averageDay);

          lateDonors.push({
            id: donor.id || donor.no_hp,
            name: donor.nama,
            phoneNumber: donor.no_hp,
            lastDonationDate,
            status: 'Telat Donasi',
            selected: false,
            donationHistory: donationHistory.slice(0, 3),
            expectedDonationDate: expectedDate.toISOString().split('T')[0],
            daysLate,
            averageDonationDay: averageDay
          });
        });

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
  }, [currentDate]);

  useEffect(() => {
    const filtered = muzakkiList.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phoneNumber.includes(search)
    );
    setFilteredMuzakki(filtered);
  }, [search, muzakkiList]);

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
    if (selectedMuzakki.length === 0) {
      alert('Pilih minimal satu muzakki yang ingin dikirimi reminder.');
      return;
    }

    selectedMuzakki.forEach(m => {
      const personalized = pesan
        .replace(/{{nama}}/gi, m.name)
        .replace(/{{tanggal}}/gi, m.averageDonationDay.toString());

      window.open(`https://wa.me/${m.phoneNumber}?text=${encodeURIComponent(personalized)}`);
    });

    alert(`Pesan telah dikirim ke ${selectedMuzakki.length} donatur`);
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
      <p className="text-gray-600 mb-6">
        Daftar donatur yang rutin berdonasi 3 bulan berturut-turut di tanggal yang konsisten,
        tetapi bulan ini sudah melewati tanggal biasa berdonasi dan belum melakukan donasi.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
            <textarea
              rows={8}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              className="w-full h-40 resize-none border-0 focus:outline-none"
              placeholder="Tulis pesan di sini..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Gunakan <code className="bg-gray-100 px-1 rounded">{`{{nama}}`}</code> untuk nama donatur dan{' '}
              <code className="bg-gray-100 px-1 rounded">{`{{tanggal}}`}</code> untuk tanggal biasa berdonasi.
            </p>
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
                  <th className="p-4 border-r border-gray-300">Tanggal Biasa Donasi</th>
                  <th className="p-4 border-r border-gray-300">Hari Terlambat</th>
                  <th className="p-4 border-r border-gray-300">Riwayat 3 Bulan</th>
                  <th className="p-4">Kirim Manual</th>
                </tr>
              </thead>
              <tbody>
                {filteredMuzakki.length === 0 ? (
                  <tr className="border-t border-gray-300">
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      {muzakkiList.length === 0
                        ? 'Tidak ada donatur yang teridentifikasi telat donasi'
                        : 'Tidak ditemukan hasil pencarian'}
                    </td>
                  </tr>
                ) : (
                  filteredMuzakki.map((m) => {
                    const personalized = pesan
                      .replace(/{{nama}}/gi, m.name)
                      .replace(/{{tanggal}}/gi, m.averageDonationDay.toString());
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
                        <td className="p-4 border-r border-gray-300 text-center">
                          Tanggal {m.averageDonationDay}
                        </td>
                        <td className="p-4 border-r border-gray-300 text-center">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            {m.daysLate} hari
                          </span>
                        </td>
                        <td className="p-4 border-r border-gray-300">
                          <div className="text-xs space-y-1">
                            {m.donationHistory.map((d, i) => {
                              const date = new Date(d.date);
                              return (
                                <div key={i}>
                                  {date.toLocaleDateString('id-ID', {
                                    month: 'short',
                                    year: 'numeric'
                                  })} (Tgl {date.getDate()}): Rp{d.amount.toLocaleString('id-ID')}
                                </div>
                              );
                            })}
                          </div>
                        </td>
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
